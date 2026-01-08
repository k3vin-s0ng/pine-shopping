"""
Card Cutter Module - Optimized evidence extraction and formatting
Philosophy: Python logic > Expensive API calls
"""

from typing import List, Optional, Dict, Any
import time
import requests
import re
import json
from bs4 import BeautifulSoup, Comment
from openai import OpenAI
import os
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from dotenv import load_dotenv

# ============================================================================
# CONFIGURATION
# ============================================================================

# API Keys - hardcoded for now
OPENROUTER_API_KEY = "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"
SCRAPINGDOG_API_KEY = "68959c18c99ddc4f102820b3"

# Cheap & Fast Model for final formatting only
MODEL_CARD_CUTTER = "google/gemini-2.5-flash-lite"

# Load environment variables
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent.parent
ENV_FILE = BACKEND_DIR / ".env"
ENV_LOCAL_FILE = PROJECT_ROOT / ".env.local"

if ENV_FILE.exists():
    load_dotenv(ENV_FILE, override=False)
elif ENV_LOCAL_FILE.exists():
    load_dotenv(ENV_LOCAL_FILE, override=False)
else:
    load_dotenv(override=False)

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_openrouter_client():
    """Initialize OpenRouter client."""
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY
    )

def get_scrapingdog_key():
    """Get ScrapingDog API key."""
    return SCRAPINGDOG_API_KEY

# ============================================================================
# FREE PYTHON HEURISTICS (Replaces Expensive AI)
# ============================================================================
def clean_html_free(html: str) -> str:
    """
    FREE text extraction using BeautifulSoup instead of AI.
    """
    soup = BeautifulSoup(html, 'html.parser')

    # Remove junk
    for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe', 'form']):
        element.decompose()

    # Remove comments
    for comment in soup.findAll(text=lambda text: isinstance(text, Comment)):
        comment.extract()

    # Get text
    text = soup.get_text(separator='\n\n')

    # Collapse whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()[:12000]  # Limit context window to save money

# ============================================================================
# Pydantic Models
# ============================================================================

class URLRequest(BaseModel):
    url: str
    goal: str = "General evidence"

class SearchRequest(BaseModel):
    goal: str

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/ping")
def ping():
    """Health check endpoint."""
    return {"status": "ok"}


# ============================================================================
# Card Cutting functions
# ============================================================================
@app.post("/cut-from-url")
async def cut_from_url(request: URLRequest, authorization: Optional[str] = Header(None)):
    """
    Cut cards from URL - returns multiple cards in categories format
    """
    IS_PRODUCTION = os.getenv("NODE_ENV", "development") == "production"

    if IS_PRODUCTION:
        if not authorization:
            print("WARNING: /cut-from-url called without authorization header in production mode")

    try:
        # Fetch and clean URL
        clean_text = fetch_and_clean_url(request.url)

        if not clean_text or len(clean_text) < 100:
            raise HTTPException(status_code=400, detail="Page content empty or blocked")

        # Call DeepSeek/AI to cut multiple cards
        cards_data = call_openrouter_api(clean_text, request.url)
        
        # Return the categories format (multiple cards)
        return cards_data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def call_openrouter_api(article_text: str, url: str) -> dict:
    """Call Open Router API to generate debate cards (original implementation)."""
    
    openrouter_api_key = OPENROUTER_API_KEY
    if not openrouter_api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
    
    prompt = f"""You are an expert high school Public Forum debate coach.
Your task is to cut evidence cards from the following article text.
### Requirements:
1. **Output multiple cards:** Make sure to cover all distinct claims, warrants, or impacts in the article.
2. **Follow Public Forum conventions:**
   - Each card must include:
     - **Tagline**: short, argumentative summary of the claim, warrant of impact (in all caps).
     - **Cited text**: excerpt from the article, with important phrases wrapped in <u>underlined</u> tags and irrelevant parts replaced with ellipses (...).
     - **Full citation**: Author, Publication, Date, URL.
   - Keep underlined sections concise and argumentative.
   - Use ellipses (...) to shorten but keep integrity.
3. **Use the entire article**: scan thoroughly for every useful claim, not just the first few paragraphs.
4. **Neutral prep**: Cut cards that could support either PRO or CON depending on how they're deployed. Don't be biased toward one side.
5. **Organize by category:**
   - Group cards into broad arguments (e.g., "ECONOMIC IMPACTS," "SECURITY RISKS," "ENVIRONMENTAL BENEFITS").
   - Within each category, number the cards.
6. **Output format** must be structured JSON:
   {{
     "categories": [
       {{
         "category": "Category Name",
         "cards": [
           {{
             "tagline": "TAGLINE IN ALL CAPS",
             "cited_text": "…underlined evidence with ellipses…",
             "citation": "Author, Publication, Date, URL"
           }}
         ]
       }}
     ]
   }}

Article URL: {url}

Article Text:
{article_text}"""

    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://debatepalai.com",
        "X-Title": "DebatePal Card Cutting Tool"
    }
    
    payload = {
        "model": "meta-llama/llama-3.3-70b-instruct:free",
        "messages": [
            {
                "role": "user",
                "content": prompt + "\n\nIMPORTANT: Your response must be valid JSON only, following the exact format specified above. Do not include any additional text before or after the JSON."
            }
        ],
        "temperature": 0.3,
        "max_tokens": 4000
    }
    
    try:
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        # Parse JSON response
        try:
            # Try to extract JSON if it's wrapped in markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            cards_data = json.loads(content)
            return cards_data
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to parse AI response as JSON. Error: {str(e)}. Response preview: {content[:500]}"
            )
    
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"DeepSeek API error: {str(e)}")
    

# ============================================================================
# Functions used in both card cutting and searching
# ============================================================================

async def fetch_and_clean_url(url: str) -> Optional[str]:
    """
    Fetch URL using ScrapingDog and clean HTML. Returns clean text or None.
    Async version using httpx.
    """
    try:
        scrapingdog_key = get_scrapingdog_key()
    except ValueError:
        # Fallback to direct request if no ScrapingDog key
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers=headers, timeout=30.0)
                resp.raise_for_status()
                return clean_html_free(resp.text)
        except Exception as e:
            print(f"Direct fetch error: {e}")
            return None

    # Use ScrapingDog with URL as last parameter
    encoded_url = urllib.parse.quote(url, safe=':/%')
    scrape_url = f"https://api.scrapingdog.com/scrape?api_key={scrapingdog_key}&dynamic=false&url={encoded_url}"
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(scrape_url, timeout=30.0)
            resp.raise_for_status()
            clean_text = clean_html_free(resp.text)
            if len(clean_text) < 200:
                return None
            return clean_text
    except Exception as e:
        print(f"ScrapingDog fetch error: {e}")
        return None


# ============================================================================
# Functions for Searching
# ============================================================================

@app.post("/search-by-goal")
async def search_by_goal(request: SearchRequest, authorization: Optional[str] = Header(None)):
    """
    Search and cut multiple cards in parallel:
    1. Search (1 ScrapingDog call)
    2. Auto-selects top 5 results
    3. Processes all URLs concurrently (5 parallel fetches + AI calls)
    """
    IS_PRODUCTION = os.getenv("NODE_ENV", "development") == "production"

    if IS_PRODUCTION:
        if not authorization:
            print("WARNING: /search-by-goal called without authorization header in production mode")

    try:
        # 1. Search (synchronous)
        goal = summarize_to_main_claim(request.goal)
        results = perform_search(goal)

        if not results:
            raise HTTPException(status_code=404, detail="No credible sources found")

        # 2. Get top 5 results
        top_results = results[:5]

        # 3. Process all URLs in parallel
        tasks = [process_single_url(article, request.goal) for article in top_results]
        cards_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out None values and exceptions
        cards = [
            card for card in cards_results 
            if card is not None and isinstance(card, dict)
        ]

        if not cards:
            raise HTTPException(status_code=404, detail="Failed to cut cards from found sources")

        return {
            "search_term": request.goal,
            "cards": cards
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@lru_cache(maxsize=1000)
def get_heuristic_credibility(url: str, title: str = "") -> dict:
    """
    Enhanced credibility check using a tiered heuristic model.
    Ranks sources by trustworthiness, filtering out blogs and low-quality content.
    """
    url_lower = url.lower()

    # Tier 0: Blocklist (Score 0.0)
    blocklist = [
        'wikipedia.org', 'reddit.com', 'twitter.com', 'x.com', 'facebook.com',
        'quora.com', 'wordpress.com', 'blogger.com', 'forum'
    ]
    if any(x in url_lower for x in blocklist):
        return {"score": 0.0, "type": "blocklist"}

    # Tier 4: Highest Quality - Academic & Government (Score 0.95)
    if any(x in url_lower for x in ['.gov', 'jstor.org', 'nature.com', 'science.org', 'springer.com', 'rand.org', 'brookings.edu']):
        return {"score": 0.95, "type": "academic_gov"}
    if '.edu' in url_lower:
        if any(x in url_lower for x in ['/blog/', 'blog.', '/students/', '/opinion/']):
            return {"score": 0.3, "type": "edu_blog"}
        return {"score": 0.9, "type": "edu_academic"}

    # Tier 3: Reputable News & Organizations (Score 0.75)
    reputable_news = [
        'reuters.com', 'apnews.com', 'bbc.com', 'nytimes.com', 'wsj.com',
        'washingtonpost.com', 'theguardian.com', 'economist.com', 'npr.org',
        'foreignaffairs.com', 'cfr.org'
    ]
    if any(x in url_lower for x in reputable_news):
        if '/opinion/' in url_lower or 'blogs.' in url_lower:
            return {"score": 0.4, "type": "reputable_opinion"}
        return {"score": 0.75, "type": "reputable_news"}

    # Tier 1: Low Quality Indicators (Score 0.2)
    if any(x in url_lower for x in ['/opinion/', '/blogs/', 'blog.']):
        return {"score": 0.2, "type": "opinion_blog"}

    # Tier 2: General Web (Default Score 0.5)
    return {"score": 0.5, "type": "general_web"}

async def cut_card_with_ai_async(text: str, source_url: str, goal: str = "General evidence") -> dict:
    """
    AI card formatting. Uses cheap model to format the card.
    Async wrapper around synchronous OpenRouter call.
    """
    try:
        client = get_openrouter_client()
    except ValueError as e:
        print(f"Warning: {e}")
        return {
            "tag": "Evidence Extracted",
            "cite": f"Source ({source_url})",
            "body": text[:500] + "..."
        }

    system = """You are a debate card cutter.
Input: Article text.
Output: Valid JSON card.
Format:
{
  "tag": "Short, punchy claim summary (max 10 words)",
  "cite": "Author Lastname, Year (Publication)",
  "body": "Verbatim quote from text supporting the tag. Use [...] for cuts."
}
If no relevant evidence found, return error in tag."""

    max_chars = 4000  # Reduced from 6000 for faster processing
    user = f"Goal: {goal}\nURL: {source_url}\nText: {text[:max_chars]}"

    try:
        # Run blocking OpenRouter call in thread pool
        completion = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                model=MODEL_CARD_CUTTER,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                temperature=0.1,
                max_tokens=300,
                response_format={"type": "json_object"}
            )
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"AI formatting error: {e}")
        return {
            "tag": "Evidence Extracted",
            "cite": f"Source ({source_url})",
            "body": text[:500] + "..."
        }


async def process_single_url(article: dict, goal: str) -> Optional[dict]:
    """
    Process a single URL: fetch, clean, and cut card.
    Returns card dict or None if processing fails.
    """
    try:
        # Fetch and clean
        clean_text = await fetch_and_clean_url(article['url'])
        
        if not clean_text:
            return None
        
        # Cut card with AI
        card_data = await cut_card_with_ai_async(clean_text, article['url'], goal)
        
        return {
            "tag": card_data.get("tag", "Extracted Evidence"),
            "cite": card_data.get("cite", "Unknown Source"),
            "body": card_data.get("body", clean_text[:500]),
            "url": article['url'],
            "credibility": get_heuristic_credibility(article['url'])['score'],
            "source_title": article['title']
        }
    except Exception as e:
        print(f"Skipping {article['url']}: {e}")
        return None


def perform_search(query: str) -> List[dict]:
    """
    Performs search using query variations, collects credible results, and sorts by score.
    Optimized with reduced variations and early exit.
    """
    try:
        scrapingdog_key = get_scrapingdog_key()
    except ValueError:
        print("ScrapingDog API key not available")
        return []

    # Reduced from 4 to 2 variations for faster search
    query_variations = [
        (query, "Original Query"),
        (f"{query} research study", "Enhanced Query"),
    ]
    
    all_results = []
    MIN_CREDIBILITY_SCORE = 0.2
    TARGET_RESULTS = 10  # Stop early if we have enough good results

    for i, (q_variation, desc) in enumerate(query_variations, 1):
        try:
            search_url = f"https://www.mojeek.com/search?q={urllib.parse.quote(q_variation)}&t=40"
            encoded_target_url = urllib.parse.quote(search_url, safe=':/%')
            scrape_url = f"https://api.scrapingdog.com/scrape?api_key={scrapingdog_key}&dynamic=false&url={encoded_target_url}"
            
            resp = requests.get(scrape_url, timeout=15)

            if resp.status_code != 200:
                print(f"ScrapingDog API error: HTTP {resp.status_code}")
                continue

            soup = BeautifulSoup(resp.text, 'html.parser')
            strategy_results = []

            # Parse search results
            candidates = []
            all_lis = soup.find_all('li')
            
            for li in all_lis:
                score = 0
                classes = li.get('class', [])
                
                h2 = li.find('h2')
                if h2:
                    score += 3
                    if h2.find('a'):
                        score += 5

                if li.find('a', class_='ob'):
                    score += 4
                
                if li.find('p', class_='s'):
                    score += 3
                
                if isinstance(classes, str):
                    classes = [classes]
                if any(re.match(r'^r\d+$', c) for c in classes):
                    score += 2

                if score >= 7:
                    h2_elem = li.find('h2')
                    link_elem = h2_elem.find('a') if h2_elem else li.find('a', class_='ob')
                    href = link_elem.get('href') if link_elem else None
                    
                    if href and href.startswith('http'): 
                        candidates.append(li)
            
            search_items = candidates[:15]

            for j, item in enumerate(search_items, 1):
                h2 = item.find('h2')
                title_link = h2.find('a') if h2 else None
                ob_link = item.find('a', class_='ob')
                
                title_text = h2.get_text(strip=True) if h2 else "No Title"
                href = None
                
                if title_link and title_link.get('href'):
                    href = title_link.get('href')
                elif ob_link and ob_link.get('href'):
                    href = ob_link.get('href')

                if href and h2:
                    cred = get_heuristic_credibility(href, title_text)

                    if cred['score'] >= MIN_CREDIBILITY_SCORE:
                        strategy_results.append({
                            "title": title_text,
                            "url": href,
                            "score": cred['score']
                        })

            all_results.extend(strategy_results)
            
            # Early exit if we have enough good results
            if len(all_results) >= TARGET_RESULTS:
                break

        except Exception as e:
            print(f"Search variation '{desc}' failed: {e}")
            continue

    if not all_results:
        print(f"No credible sources found for '{query}'")
        return []

    # De-duplicate based on URL
    seen_urls = {}
    for result in all_results:
        if result['url'] not in seen_urls or result['score'] > seen_urls[result['url']]['score']:
            seen_urls[result['url']] = result
    
    unique_results = list(seen_urls.values())
    sorted_results = sorted(unique_results, key=lambda x: x['score'], reverse=True)
    
    return sorted_results

# Keep old endpoint for backward compatibility
def extract_article_text(url: str) -> str:
    """Extract text content from a URL (original implementation)."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        for script in soup(["script", "style"]):
            script.decompose()
        
        article = soup.find('article') or soup.find('main') or soup.find('div', class_=['article', 'content', 'post'])
        
        if article:
            text = article.get_text(separator=' ', strip=True)
        else:
            text = soup.get_text(separator=' ', strip=True)
        
        text = ' '.join(text.split())
        
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    
async def summarize_to_main_claim(text: str) -> str:
    """
    Takes document text and returns a single main claim summary.
    """
    try:
        client = get_openrouter_client()
    except ValueError as e:
        print(f"Warning: {e}")
        return "Unable to generate summary - API key missing"

    system = """You are a debate analyst. 
Extract the single main claim or argument from the provided text.
Output: One concise sentence (max 20 words) stating the core argument."""

    max_chars = 5000  # Limit input size
    user = f"Text: {text[:max_chars]}"

    try:
        completion = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                model=MODEL_CARD_CUTTER,  # Or use a different model if preferred
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                temperature=0.3,
                max_tokens=50
            )
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI summary error: {e}")
        return "Error generating summary"