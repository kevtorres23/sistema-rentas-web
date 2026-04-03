type StyleProperties = {
    backgroundColor: string;
    dotBackgroundColor: string;
    borderColor: string;
    color: string;
    name: string;
};

type StyleObject = Record<"available" | "archived" | "occupied", StyleProperties>;

function StatusTag({ status }: { status: "available" | "archived" | "occupied" }) {
    const tagStyleClasses: StyleObject = {
        available: {
            backgroundColor: "bg-[rgb(39,200,64,0.12)]",
            dotBackgroundColor: "bg-green-500",
            borderColor: "border-green-500",
            color: "text-green-500",
            name: "Disponible"
        },
        archived: {
            backgroundColor: "bg-[rgb(59,130,246,0.12)]",
            dotBackgroundColor: "bg-blue-500",
            borderColor: "border-blue-500",
            color: "text-blue-500",
            name: "Archivada"
        },
        occupied: {
            backgroundColor: "bg-[rgb(244,63,94,0.12)]",
            dotBackgroundColor: "bg-red-500",
            borderColor: "border-red-500",
            color: "text-red-500",
            name: "Ocupada"
        }
    };

    return (
        <div className={`px-2 py-1 flex flex-row gap-1 items-center self-start w-auto rounded-md ${tagStyleClasses[status as keyof StyleObject].backgroundColor} border ${tagStyleClasses[status as keyof StyleObject].borderColor}`}>
            <div className={`w-1.5 h-1.5 rounded-[50%] ${tagStyleClasses[status as keyof StyleObject].dotBackgroundColor}`}></div>

            <p className={`text-sm ${tagStyleClasses[status as keyof StyleObject].color} font-medium`}>{tagStyleClasses[status as keyof StyleObject].name}</p>
        </div>
    );
};

export default StatusTag;