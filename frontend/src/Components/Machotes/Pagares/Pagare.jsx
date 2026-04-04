import { Page, Text, View } from '@react-pdf/renderer';
import { Document } from '@react-pdf/renderer';
import pagareStyles from './PagareStyles';

/**
 * Esta función crea un documento PDF con una lista de pagarés en base a la duración del contrato.
 * 
 * Por ejemplo, genera **doce** pagarés en un documento cuando el contrato es a un año.
 * @param informacion Representa el objeto que contiene toda la información necesaria para crear los pagarés.
 * @returns Un documento PDF conteniendo todos los pagarés, en base a la duración del contrato.
 */

export function DocumentoPagare(duracionContrato) {
    const Document = (duracionContrato) => (
        <Document>
            <Page size={'A4'}>
                <PagareIndividual informacion={"Holaaa"} />
            </Page>
        </Document>
    );

    return (
        <Document/>
    )
};

/**
 * Esta función crea un pagaré individual usando la información recibida.
 * @param informacion
 */

export function PagareIndividual(informacion) {
    return (
        <View style={pagareStyles.mainContainer}>
            <Text>{informacion}</Text>
        </View>
    );
};