import { StyleSheet } from "@react-pdf/renderer";

const estilos = StyleSheet.create({
    textoChico: {
        fontSize: 8,
    },
    textoChicoGrueso: {
        fontSize: 8,
        fontWeight: 600,
    },
    textoChicoDerecha: {
        fontSize: 8,
        textAlign: "right",
    },
    textoNormal: {
        fontSize: 10,
        fontWeight: 400,
    },
    textoNormalGrueso: {
        fontSize: 10,
        fontWeight: 700,
    },
    hoja: {
        padding: 30,
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    contenedorPagare: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "black",
        padding: 8
    },
    encabezado: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    enumerador: {
        display: "flex",
        flexDirection: "row",
        gap: 5,
        alignItems: "center",
        justifyContent: "center",
    },
    cuadroEnumerador: {
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "black",
        padding: 2
    },
    valorPagare: {
        display: "flex",
        flexDirection: "row",
        gap: 5,
    },
    fecha: {
        display: "flex",
        flexDirection: "row",
        gap: 5,
        justifyContent: "flex-end",
        justifySelf: "flex-end",
    },
    cuerpo: {
        fontSize: 8,
        lineHeight: "150%",
    },
    parteInferior: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    datosPersonas: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    contenedorDatos: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
    },
    firmas: {
        display: "flex",
        width: "60%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 50,
    },
    espacioFirma: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    contenedorFirma: {
        padding: 5,
        width: "100%",
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
        borderBottomColor: "black,"
    },
});

export default estilos;