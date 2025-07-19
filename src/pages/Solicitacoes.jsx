import { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

async function enviarMensagemWhatsApp(numero, mensagem) {
    try {
        const response = await fetch("https://7385c0ab1ea4.ngrok-free.app/enviar-mensagem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numero, mensagem }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        throw error;
    }
}
// aqui estamos importando as dependências necessárias, incluindo o React, hooks do Firebase e a função para enviar mensagens via WhatsApp.//

export default function Solicitacoes() {
    const [solicitacoes, setSolicitacoes] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (!user) {
                navigate("/login");
            }
        });

        if (auth.currentUser) {
            const solicitacoesRef = collection(db, "solicitacoes-clientes");
            const unsubscribeSnapshot = onSnapshot(solicitacoesRef, (snapshot) => {
                const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setSolicitacoes(lista);
            });

            return () => {
                unsubscribeAuth();
                unsubscribeSnapshot();
            };
        }

        return () => unsubscribeAuth();
    }, [navigate]);

    async function aprovarSolicitacao(solicitacao) {
        try {
            await deleteDoc(doc(db, "solicitacoes-clientes", solicitacao.id));
            const numero = (solicitacao.telefone || solicitacao.contato || '').replace(/\D/g, ""); // Usar telefone primeiro, depois contato
            const nomeCliente = solicitacao.nomeCompleto || solicitacao.nome || "Cliente"; // Usar nomeCompleto primeiro, depois nome
            const mensagem = `Olá ${nomeCliente}, sua solicitação foi aprovada! Em breve entraremos em contato para agendar a instalação.`;

            if (numero) {
                await enviarMensagemWhatsApp(numero, mensagem);
                alert("Solicitação aprovada e mensagem enviada!");
            } else {
                alert("Solicitação aprovada, mas não foi possível enviar mensagem: número de contato não encontrado.");
            }
        } catch (error) {
            console.error("Erro ao aprovar solicitação:", error);
            alert("Erro ao aprovar solicitação.");
        }
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">
                Solicitações de Internet ({solicitacoes.length})
            </h1>

            {solicitacoes.length === 0 ? (
                <p className="text-gray-600 mt-4">Nenhuma solicitação encontrada.</p>
            ) : (
                <>
                    {/* Tabela Feirinha */}
                    {solicitacoes.some((s) => s.local === "feirinha") && (
                        <>
                            <h2 className="text-xl font-bold mt-8 mb-4 text-blue-700">Feirinha</h2>
                            <table className="w-full text-sm border-collapse border border-gray-300 shadow-sm rounded-lg overflow-hidden">
                                <thead className="bg-blue-100 text-blue-800">
                                    <tr>
                                        <th className="px-3 py-2 border text-left">Nome</th>
                                        <th className="px-3 py-2 border">CPF</th>
                                        <th className="px-3 py-2 border">Contato</th>
                                        <th className="px-3 py-2 border">Plano</th>
                                        <th className="px-3 py-2 border">Status</th>
                                        <th className="px-3 py-2 border">Corredor</th>
                                        <th className="px-3 py-2 border">Nº Banca</th>
                                        {/* NOVA COLUNA ADICIONADA AQUI */}
                                        <th className="px-3 py-2 border text-left">observacoes</th>
                                        <th className="px-3 py-2 border text-center">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {solicitacoes
                                        .filter((s) => s.local === "feirinha")
                                        .map((s) => (
                                            <tr key={s.id} className="even:bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                                                <td className="px-3 py-2 border text-left font-medium text-gray-900">
                                                    {s.nomeCompleto || s.nome || "N/A"}
                                                </td>
                                                <td className="px-3 py-2 border text-center text-gray-700">{s.cpf || "N/A"}</td>
                                                <td className="px-3 py-2 border text-center text-gray-700">{s.telefone || s.contato || "N/A"}</td>
                                                <td className="px-3 py-2 border text-center text-gray-700">{s.planoInteresse || s.plano || "N/A"}</td>
                                                <td className="px-3 py-2 border text-center capitalize">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.status === "aprovado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                                        }`}>
                                                        {s.status || "Pendente"}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 border text-center text-gray-700">{s.corredor || "—"}</td>
                                                <td className="px-3 py-2 border text-center text-gray-700">{s.numeroBanca || "—"}</td>
                                                {/* CÉLULA PARA OBSERVAÇÕES */}
                                                <td className="px-5 py-2 border text-left text-gray-700">
                                                    {s.observacoes || "—"}
                                                </td>
                                                <td className="px-3 py-2 border text-center">
                                                    <button
                                                        onClick={() => aprovarSolicitacao(s)}
                                                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                                                    >
                                                        Aprovar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    {/* Tabela Residência */}
                    {solicitacoes.some((s) => s.local === "residencia") && (
                        <>
                            <h2 className="text-xl font-bold mt-8 mb-4 text-blue-700">Residência</h2>
                            <table className="w-full text-sm border-collapse border border-gray-300 shadow-sm rounded-lg overflow-hidden">
                                <thead className="bg-blue-100 text-blue-800">
                                    <tr>
                                        <th className="px-3 py-2 border text-left">Nome</th>
                                        <th className="px-3 py-2 border">CPF</th>
                                        <th className="px-3 py-2 border">Contato</th>
                                        <th className="px-3 py-2 border">Plano</th>
                                        <th className="px-3 py-2 border">observacoes</th>
                                        <th className="px-3 py-2 border text-left">Endereço</th>
                                        <th className="px-3 py-2 border text-left">Cidade/UF</th>
                                        {/* AQUI VOCÊ TAMBÉM PODE ADICIONAR OBSERVAÇÕES SE FOR RELEVANTE PARA RESIDÊNCIAS */}
                                        {/* <th className="px-3 py-2 border text-left">Obs.</th> */}
                                        <th className="px-3 py-2 border text-center">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {solicitacoes
                                        .filter((s) => s.local === "residencia")
                                        .map((s) => (
                                            <tr key={s.id} className="even:bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                                                <td className="px-3 py-2 border text-left font-medium text-gray-900">
                                                    {s.nomeCompleto || s.nome || "N/A"}
                                                </td>
                                                <td className="px-3 py-2 border text-center text-gray-700">{s.cpf || "N/A"}</td>
                                                <td className="px-3 py-2 border text-center text-gray-700">{s.telefone || s.contato || "N/A"}</td>
                                                <td className="px-3 py-2 border text-center text-gray-700">{s.planoInteresse || s.plano || "N/A"}</td>
                                                <td className="px-5 py-2 border text-left text-gray-700">
                                                    {s.observacoes || "—"}
                                                </td>

                                                <td className="px-3 py-2 border text-left text-gray-700">
                                                    {`${s.rua || ''}${s.numero ? `, ${s.numero}` : ''}`}
                                                    {(s.rua || s.numero) && s.bairro ? <br /> : ''}
                                                    {s.bairro || ''}
                                                    {(s.complemento && (s.rua || s.numero || s.bairro)) ? <br /> : ''}
                                                    {s.complemento ? `(Comp: ${s.complemento})` : ''}
                                                </td>
                                                <td className="px-3 py-2 border text-left text-gray-700">
                                                    {`${s.cidade || ''}${s.estado ? ` - ${s.estado}` : ''}` || "N/A"}
                                                </td>
                                                {/* CÉLULA PARA OBSERVAÇÕES (se decidir adicionar) */}
                                                {/* <td className="px-3 py-2 border text-left text-gray-700">
                                                    {s.observacoes || "—"}
                                                </td> */}
                                                <td className="px-3 py-2 border text-center">
                                                    <button
                                                        onClick={() => aprovarSolicitacao(s)}
                                                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                                                    >
                                                        Aprovar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

// This code is a React component that displays a list of internet service requests.
