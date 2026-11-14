export default function Container ({children}: {children: React.ReactNode}) {
    return <div className="max-w-[90rem] w-full mx-auto min-[40rem]:px-[3rem] px-[1.2rem]">
        {children}
    </div>
};