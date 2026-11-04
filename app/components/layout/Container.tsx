export default function Container ({children}: {children: React.ReactNode}) {
    return <div className="max-w-[90rem] w-full mx-auto px-[3rem]">
        {children}
    </div>
};