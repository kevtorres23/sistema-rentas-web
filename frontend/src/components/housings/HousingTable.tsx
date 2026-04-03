import { type Housing } from "@/types/HousingTypes";
import HousingTableActions from "./HousingTableActions";
import { MoreHorizontalIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import StatusTag from "../StatusTag";


type TableProps = {
    data: Housing[];
};

function HousingTable(props: TableProps) {
    return (
        <Table>
            <TableHeader className="bg-primary">
                <TableRow className="">
                    <TableHead className="text-white rounded-tl-md">Estatus</TableHead>
                    <TableHead className="text-white">Imagen</TableHead>
                    <TableHead className="text-white">Ubicación y Precio</TableHead>
                    <TableHead className="text-white">Arrendatario</TableHead>
                    <TableHead className="text-white">Fecha de Pago</TableHead>
                    <TableHead className="text-white rounded-tr-md">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {props.data.map((housing, id) => (
                    <TableRow key={id}>
                        <TableCell className="flex items-start max-w-10 lg:min-w-10 min-w-35">
                            <StatusTag status={
                            housing.status === "ARCHIVED" ? "archived" : (
                                housing.status === "AVAILABLE" ? "available" : "occupied"
                            )
                        } />
                        </TableCell>
                        <TableCell className="lg:min-w-20 min-w-40">img</TableCell>
                        <TableCell>{housing.street}</TableCell>
                        <TableCell>{housing.tenant_name}</TableCell>
                        <TableCell>{format(housing.latest_due_date, "PPP", { locale: es })}</TableCell>
                        <TableCell>
                            <HousingTableActions isTenant={housing.latest_due_date != undefined}/>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default HousingTable;