import { dateFmt } from "@/app/utils/dateFormat";
import { SafetyOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useState } from "react";

export default function UserRender ({name, username, isTrusted= false, imageUrl, size="small", lastClerkUpdate}: {
    name?: string,
    username?: string,
    isTrusted?: boolean,
    imageUrl?: string,
    size?: "large"|"small",
    lastClerkUpdate?: number,
}) {

    const [imgSrc, setImgSrc]= useState(imageUrl);

    return <div className={`flex gap-[.5rem] p-[.5rem] ${size==="small" ? 'items-center': 'items-start'} rounded-md`}>
        {size==="small"
        ? <div className="w-[2.25rem] h-[2.25rem] rounded-full shrink-0 overflow-hidden">
            <Image
                src={imgSrc || "/placeholder.svg"}
                alt={"User image"}
                width={72}
                height={72}
                className="object-cover h-full"
                onError={()=> {setImgSrc("/hero_.jpg")}}
            />
        </div>
        : <div className="w-[4.5rem] h-[4.5rem] rounded-full shrink-0 overflow-hidden">
            <Image
                src={imgSrc || "/placeholder.svg"}
                alt={"User image"}
                width={144}
                height={144}
                className="object-cover h-full"
                onError={()=> {setImgSrc("/hero_.jpg")}}
            />
        </div>
        }
        <div className="flex flex-col gap-0">
            <div className="flex gap-[.5rem]">
                <div className="font-sans font-semibold text-[.875rem] text-foreground-1 capitalize">{name || username || "Unknown user"}</div>
                {
                    isTrusted &&
                    <div className="rounded-full bg-secondary flex min-w-[1.2rem] h-[1.2rem] gap-[.25rem] items-center justify-center text-primary font-semibold text-[.75rem] w-max tracking-[0.038rem]">
                        <SafetyOutlined />
                    </div>
                }
            </div>
            <div className="font-sans font-semibold text-[.75rem] text-primary">@{username || "@user"}</div>
            {
                lastClerkUpdate&&
                <div className="font-light text-foreground/60">Last Clerk profile update: {dateFmt.format(lastClerkUpdate)}</div>
            }
        </div>
    </div>;
};
