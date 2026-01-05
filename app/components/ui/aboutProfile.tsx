import Image from "next/image"

export default function AboutProfile(props: {
    src: string; desc: string; title: string; name: string; 
}) {
    return (
        <div className="flex flex-col">
            <Image
                src={props.src}
                width={300}
                height={300}
                alt={props.name}
                className="rounded-lg object-cover aspect-square mb-4"
            />
            <h3 className="text-xl font-medium">{props.name}</h3>
            <p className="text-gray-500">{props.title}</p>
            <p className="text-sm text-gray-600 mt-2">
                {props.desc}
            </p>
        </div>
    )
}