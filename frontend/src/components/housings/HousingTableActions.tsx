import {
    MoreHorizontalIcon,
    SquarePen,
    Archive,
    ScrollText,
    House
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function HousingTableActions({ isTenant }: { isTenant: boolean }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontalIcon />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-auto">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                    <DropdownMenuItem>
                        <SquarePen />
                        Modificar datos
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                        <Archive />
                        Archivar
                    </DropdownMenuItem>

                    <DropdownMenuItem>Cambiar a ocupada</DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuLabel>Información</DropdownMenuLabel>
                    <DropdownMenuItem>
                        {isTenant ? (
                            <>
                                <ScrollText />
                                <p>Datos del contrato</p>
                            </>
                        ) : (
                            <p>Agregar contrato</p>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <>
                            <House />
                            <p>Datos de la vivienda</p>
                        </>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default HousingTableActions;