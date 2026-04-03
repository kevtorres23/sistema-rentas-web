type Incidences = {
    name: string;
    color: string;
    value: string;
};

type VisibleIncidences = {
    name: string;
    color: string;
    value: string;
    unknownVal: number;
}

type Inquilino = {
    montoOriginal: number;
    inquilino: string;
    departamento: string;
    estatus: string;
}

export type { Incidences, Inquilino, VisibleIncidences };