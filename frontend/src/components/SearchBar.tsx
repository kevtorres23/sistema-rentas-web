import { Search } from "lucide-react"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"

type SearchProps = {
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function SearchBar(props: SearchProps) {
    return (
        <InputGroup className="max-w-xs bg-white">
            <InputGroupInput
                onChange={props.onChange}
                placeholder={props.placeholder} 
                value={props.value}
            />
            <InputGroupAddon>
                <Search />
            </InputGroupAddon>
        </InputGroup>
    )
}