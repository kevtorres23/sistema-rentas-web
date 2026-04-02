// All the types and sub-types related to the Contracts are declared here.

type InvoiceStatus = "PENDING" | "PAID";

type Invoice = {
    id: string;
    duedate: Date;
    amount: number;
    total_paid: number;
    status: string;
};

type Contract = {
    id: string;
    name: string;
    startdate: Date;
    enddate: Date;
    depositamount: number;
    tenantname: string;
};

export type { InvoiceStatus, Invoice, Contract };