import { StyleSheet } from "@react-pdf/renderer";

const estilos = StyleSheet.create({
    textoChico: {
        fontSize: 12,
    },
    textoChicoGrueso: {
        fontSize: 12,
        fontWeight: 600,
    },
    textoChicoDerecha: {
        fontSize: 12,
        textAlign: "right",
    },
    textoNormal: {
        fontSize: 14,
        fontWeight: 400,
    },
    textoNormalGrueso: {
        fontSize: 14,
        fontWeight: 700,
    },
    hoja: {
        padding: 40,
    },
    contenedorPagare: {
        display: "flex",
        flexDirection: "column",
        gap: 20,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "black",
        padding: 10
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
        fontSize: 12,
        lineHeight: "150%",
    }
});

export default estilos;