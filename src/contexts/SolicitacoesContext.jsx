import { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const SolicitacoesContext = createContext();

export function SolicitacoesProvider({ children }) {
    const [pendentes, setPendentes] = useState(0);

    async function contarSolicitacoesPendentes() {
        try {
            const colRef = collection(db, "solicitacoes-clientes");
            const snapshot = await getDocs(colRef);
            const pendentesCount = snapshot.docs.filter(doc => {
                const data = doc.data();
                return data.status?.toLowerCase() !== "aprovado";
            }).length;
            setPendentes(pendentesCount);
        } catch (error) {
            console.error("Erro ao contar solicitações pendentes:", error);
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                contarSolicitacoesPendentes();
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <SolicitacoesContext.Provider value={{ pendentes, contarSolicitacoesPendentes }}>
            {children}
        </SolicitacoesContext.Provider>
    );
}

export function useSolicitacoes() {
    return useContext(SolicitacoesContext);
}
