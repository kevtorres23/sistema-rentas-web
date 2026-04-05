import { Page, Document, Text, View, Image } from '@react-pdf/renderer';
import { SeccionContrato } from './Declaraciones';
import estilos from './EstilosContrato';
import { format, lastDayOfMonth } from "date-fns";
import { es } from "date-fns/locale";

export function DocumentoContrato(informacion) {
    const infoContrato = {
        fecha: new Date(2026, 2, 31),
        nombreArrendador: "Betzai",
        apellidoPatArrendador: "Cháidez",
        apellidoMatArrendador: "Lechuga",
        nombreArrendatario: "Juan Sebastián",
        apellidoPatArrendatario: "Puin",
        apellidoMatArrendatario: "Almario",
        nombreFiador: "Kevin",
        apellidoPatFiador: "Torres",
        apellidoMatFiador: "Urbina"
    };

    const diaContrato = infoContrato.fecha.getDate();
    const mesContrato = infoContrato.fecha.getMonth();
    const añoContrato = infoContrato.fecha.getFullYear();

    const nombreCompletoArrendador = infoContrato.nombreArrendador + " " + infoContrato.apellidoMatArrendador + " " + infoContrato.apellidoPatArrendador;
    const nombreCompletoArrendatario = infoContrato.nombreArrendatario + " " + infoContrato.apellidoMatArrendatario + " " + infoContrato.apellidoPatArrendatario;

    return (
        <Document>
            <Page style={estilos.hoja}>
                <View style={estilos.seccion}>
                    <Text style={estilos.centrado}>
                        CONTRATO DE ARRENDAMIENTO
                    </Text>

                    <Text style={estilos.texto}>
                        <Text style={estilos.textoMayus}>
                            Que celebran en la ciudad de Durango, Durango, a <Text style={estilos.textoBold}>{diaContrato} del mes de {format(mesContrato, "MMMM", { locale: es })} del año {añoContrato}</Text>,
                            por una parte el Lic. <Text style={estilos.textoBold}>{nombreCompletoArrendador}</Text>, por sus propios derechos, a quien en lo sucesivo se denominará <Text style={estilos.boldItalic}>"el arrendador"</Text>,
                            y por la otra parte <Text>{nombreCompletoArrendatario}</Text>, por sus propios derechos, referido en lo futuro como <Text style={estilos.boldItalic}>"el arrendatario"</Text>, así como el C. ___________________
                            constituyéndose como <Text style={estilos.boldItalic}>"fiador"</Text> del arrendatario, el cual se regirá al tenor de las siguientes <Text style={estilos.textoBold}>declaraciones</Text> y <Text style={estilos.textoBold}>cláusulas</Text>:
                        </Text>
                    </Text>
                </View>

                <SeccionContrato />
            </Page>
        </Document>
    );
};