import type React from "react";
import AdminNavbar from "./AdminNavbar";
import Navbar from "./Navbar";

type LayoutProps = {
    sectionName: string;
    upperRightElem?: React.ReactElement;
    children: React.ReactNode;
    tabName: string;
};

function SystemLayout(props: LayoutProps) {
    return (
        <>
            <AdminNavbar activeTab={props.tabName}/>

            <div className="w-full h-full bg-slate-100 px-15 py-10 flex flex-col gap-5">
                <div className="w-full flex flex-row items-center justify-between">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        {props.sectionName}
                    </h1>

                    {props.upperRightElem}
                </div>

                {props.children}
            </div>
        </>
    )
};

export default SystemLayout;