import type React from "react";

type LinkProps = {
    tabName: string;
    icon: React.ReactNode;
    isActive: boolean;
};

function NavbarLink(props: LinkProps) {
    return (
        <div className={`flex flex-row gap-2 cursor-pointer ${props.isActive ? "bg-slate-200 text-primary" : "text-slate-900 hover:bg-slate-200"} px-2 py-1.5 rounded-md`}>
            {props.icon}

            <p className={`text-sm ${props.isActive ? "font-medium" : "font-normal"}`}>
                {props.tabName}
            </p>
        </div>
    );
};

export default NavbarLink;