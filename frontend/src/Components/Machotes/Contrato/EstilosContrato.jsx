import { StyleSheet } from "@react-pdf/renderer";

const estilos = StyleSheet.create({
    hoja: {
        padding: 50,
    },
    seccion: {
        gap: 10,
    },
    texto: {
        fontSize: 12,
        lineHeight: "150%",
        textAlign: "justify",
    },
    textoBold: {
        fontSize: 12,
        fontWeight: 600,
        lineHeight: "150%",
    },
    textoMayus: {
        fontSize: 12,
        textTransform: "uppercase",
        lineHeight: "150%",
    },
    textoSeparado: {
        fontSize: 12,
        letterSpacing: "5%",
        lineHeight: "150%",
    },
    boldItalic: {
        fontSize: 12,
        fontWeight: "600",
        fontStyle: "italic",
        lineHeight: "150%",
    },
    centrado: {
        fontSize: 12,
        textAlign: "center",
        fontWeight: 600,
        lineHeight: "150%",
    }
});

export default estilos;