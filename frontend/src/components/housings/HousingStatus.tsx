type StyleProperties = {
    backgroundColor: string;
    name: string;
};

type StyleObject = Record<"all" | "available" | "archived" | "occupied", StyleProperties>;

type ButtonProps = {
    status: "all" | "occupied" | "archived" | "available",
    isActive: boolean,
}

function HousingStatusBtn(props: ButtonProps) {
    const statusStyleClasses: StyleObject = {
        all: {
            backgroundColor: "bg-sky-600",
            name: "Todas"
        },

        available: {
            backgroundColor: "bg-green-500",
            name: "Disponibles"
        },
        archived: {
            backgroundColor: "bg-blue-500",
            name: "Archivadas"
        },
        occupied: {
            backgroundColor: "bg-red-500",
            name: "Ocupadas"
        }
    };

    return (
        <div className={`flex flex-row gap-1 rounded-md cursor-pointer items-center justify-center px-3 py-1.5 ${props.isActive ? statusStyleClasses[props.status as keyof StyleObject].backgroundColor : "bg-white hover:bg-slate-100 border border-slate-200"}`}>
            {!props.isActive && props.status != "all" && (
                <div className={`w-2 h-2 rounded-[50%] ${statusStyleClasses[props.status as keyof StyleObject].backgroundColor}`}></div>
            )}

            <p className={`text-sm font-medium ${props.isActive ? "text-white" : "text-slate-900"}`}>
                {statusStyleClasses[props.status as keyof StyleObject].name}
            </p>
        </div>
    );
};

export default HousingStatusBtn;