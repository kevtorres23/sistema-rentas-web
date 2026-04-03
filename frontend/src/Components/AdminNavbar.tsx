import NavbarLink from "./NavbarLink";
import {
    LayoutDashboard,
    House,
    MessageCircleWarning,
    ScrollText,
    Settings,
    Bell,
    UserRound
} from "lucide-react";

function AdminNavbar({ activeTab }: { activeTab: string }) {
    return (
        <nav className="flex sticky top-0 z-999 flex-row w-full items-center justify-between px-15 py-5 border-b border-slate-200 bg-white">
            <div className="">
                <p className="text-2xl font-semibold text-slate-900">AlquilApp</p>
            </div>

            <div className="tabs flex flex-row gap-4">
                <NavbarLink
                    tabName="Dashboard"
                    icon={<LayoutDashboard size={18}/>}
                    isActive={activeTab === "dashboard"}
                />

                <NavbarLink
                    tabName="Viviendas"
                    icon={<House size={18}/>}
                    isActive={activeTab === "viviendas"}
                />

                <NavbarLink
                    tabName="Incidencias"
                    icon={<MessageCircleWarning size={18} />}
                    isActive={activeTab === "incidencias"}
                />

                <NavbarLink
                    tabName="Contratos"
                    icon={<ScrollText size={18} />}
                    isActive={activeTab === "contratos"}
                />
            </div>

            <div className="w-auto flex flex-row gap-4">
                <Settings size={21} className="text-slate-800 hover:text-primary" strokeWidth={2} />

                <Bell size={21} className="text-slate-800 hover:text-primary" strokeWidth={2} />

                <UserRound size={21} className="text-slate-800 hover:text-primary" strokeWidth={2} />
            </div>
        </nav>
    );
};

export default AdminNavbar;