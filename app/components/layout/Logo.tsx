import Link from "next/link";

export default function Logo ({dark= false}: {dark?: boolean}) {
    return <Link href={"/"} className={`font-bold text-[1.25rem] ${dark? 'text-white' : 'text-primary'} w-[15rem] font-jakarta w-max`}>LendLoop</Link>;
};