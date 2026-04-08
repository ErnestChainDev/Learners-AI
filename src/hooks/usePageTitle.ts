import { useEffect } from "react";

export function usePageTitle(title: string) {
    useEffect(() => {
        document.title = `${title} - Learner's Portal`;
    }, [title]);
}