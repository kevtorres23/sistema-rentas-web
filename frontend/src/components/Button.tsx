import type React from "react";

interface ButtonProps {
    text: string;
    icon?: React.ReactNode;
    onClick: () => void;
}

function NormalButton(props: ButtonProps) {
    return (
        <button onClick={props.onClick} className="px-3 py-2 bg-primary rounded-sm hover:opacity-80 cursor-pointer flex flex-row gap-1.5 items-center">
            {props.icon}

            <p className="text-white text-sm font-medium">
                {props.text}
            </p>
        </button>
    )
};

export default NormalButton;