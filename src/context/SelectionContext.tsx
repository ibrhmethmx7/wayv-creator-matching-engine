"use client";

import { createContext, useContext, useMemo, useState } from "react";

type SelectionContextValue = {
    selectedCampaignId: string;
    selectedCreatorId: string;
    setSelectedCampaignId: (value: string) => void;
    setSelectedCreatorId: (value: string) => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
    const [selectedCampaignId, setSelectedCampaignId] = useState("");
    const [selectedCreatorId, setSelectedCreatorId] = useState("");

    const value = useMemo(
        () => ({
            selectedCampaignId,
            selectedCreatorId,
            setSelectedCampaignId,
            setSelectedCreatorId,
        }),
        [selectedCampaignId, selectedCreatorId]
    );

    return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelectionContext(): SelectionContextValue {
    const ctx = useContext(SelectionContext);
    if (!ctx) {
        throw new Error("useSelectionContext must be used within SelectionProvider");
    }
    return ctx;
}

