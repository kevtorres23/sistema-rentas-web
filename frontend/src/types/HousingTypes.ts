// All the types required for the 'Housing Page' are declared in this file.

type HousingStatus = "OCCUPIED" | "AVAILABLE" | "ARCHIVED";

type Housing = {
    id: string;
    status: HousingStatus;
    street: string;
    int_num: string;
    ext_num: string;
    division: string;
    city: string;
    state: string;
    postal_code: string;
    depositamount: number;
    tenant_name: string;
    latest_due_date: Date;
    rc_id: string;
};

export type { Housing, HousingStatus };
