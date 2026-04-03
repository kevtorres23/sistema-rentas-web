interface ButtonProps {
    text: string;
    onClick: () => void;
}

function NormalButton(props: ButtonProps) {
    return (
        <button onClick={props.onClick} className="px-3 py-1.5 bg-primary rounded-sm hover:opacity-80 cursor-pointer">
            <p className="text-white text-sm font-medium">
                {props.text}
            </p>
        </button>
    )
};

export default NormalButton;