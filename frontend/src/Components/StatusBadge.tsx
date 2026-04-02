function StatusBadge({ status }: { status: string }) {
    let color = "secondary";
    let dotColor = "secondary";

    if (status === "PENDING") {
        color = "danger";
        dotColor = "danger";
    } else if (status === "PAID") {
        color = "success";
        dotColor = "success";
    } else if (status === "PENDING") {
        color = "warning";
        dotColor = "warning";
    }

    return (
        <span className={`badge bg-light text-dark border`}>
            <span
                className={`me-1 rounded-circle bg-${dotColor}`}
                style={{ width: 8, height: 8, display: "inline-block" }}
            ></span>
            {status}
        </span>
    );
};

export default StatusBadge;