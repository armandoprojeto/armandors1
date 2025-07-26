import { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

// Função para enviar mensagem via WhatsApp
async function enviarMensagemWhatsApp(numero, mensagem) {
    try {
        const response = await fetch("https://39a155634620.ngrok-free.app/enviar-mensagem", {
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

// Função para formatar valor monetário
function formatarValor(valor) {
    if (!valor) return "—";

    // Se o valor já é um número
    if (typeof valor === 'number') {
        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
    }

    // Se o valor é string, tenta converter
    if (typeof valor === 'string') {
        // Remove caracteres não numéricos exceto vírgula e ponto
        const valorLimpo = valor.replace(/[^\d.,]/g, '');

        // Substitui vírgula por ponto para conversão
        const valorNumerico = parseFloat(valorLimpo.replace(',', '.'));

        if (!isNaN(valorNumerico)) {
            return `R$ ${valorNumerico.toFixed(2).replace('.', ',')}`;
        }
    }

    return "—";
}

export default function Solicitacoes() {
    const [solicitacoes, setSolicitacoes] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (!user) {
                navigate("/login");
            }
        });

        let unsubscribeSnapshot;
        // Only set up snapshot listener if user is already authenticated on mount
        if (auth.currentUser) {
            const solicitacoesRef = collection(db, "solicitacoes-clientes");
            unsubscribeSnapshot = onSnapshot(solicitacoesRef, (snapshot) => {
                const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setSolicitacoes(lista);
            }, (error) => {
                console.error("Erro ao carregar solicitações:", error);
                alert("Erro ao carregar solicitações. Verifique o console para mais detalhes.");
            });
        }

        // Cleanup function for useEffect
        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
        };
    }, [navigate]);

    const gerarPppoeESenha = (nome, cpf, contato) => {
        // Ensure nome is a string for substring
        const usuarioPppoe = `${(nome || '').substring(0, 3).toLowerCase()}${Math.floor(Math.random() * 1000)}`;

        let senha = '';
        const cpfLimpo = (cpf || '').replace(/\D/g, ''); // Remove non-digits
        const contatoLimpo = (contato || '').replace(/\D/g, ''); // Remove non-digits

        const ultimos3Cpf = cpfLimpo.slice(-3);
        const ultimos3Contato = contatoLimpo.slice(-3);

        senha = `${ultimos3Cpf}${ultimos3Contato}`;

        // Ensure senha is at least 3 characters long if not enough from CPF/Contato
        if (senha.length < 3) {
            senha += Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            senha = senha.substring(0, 6); // Cap the length to 6 to avoid excessively long passwords
        }

        return { usuarioPppoe, senha };
    };

    async function aprovarSolicitacao(solicitacao) {
        try {
            const { usuarioPppoe, senha } = gerarPppoeESenha(
                solicitacao.nomeCompleto || solicitacao.nome,
                solicitacao.cpf,
                solicitacao.telefone || solicitacao.contato
            );

            // Preserva o valor original da solicitação
            const updatedSolicitacao = {
                ...solicitacao,
                status: "Aguardando Instalação",
                usuarioPppoe,
                senha,
                // Garante que o valor seja mantido
                valor: solicitacao.valor || solicitacao.valorPlano || 0,
            };

            await setDoc(doc(db, "solicitacoes-clientes", solicitacao.id), updatedSolicitacao);

            const numero = (solicitacao.telefone || solicitacao.contato || '').replace(/\D/g, "");
            const nomeCliente = solicitacao.nomeCompleto || solicitacao.nome || "Cliente";
            const valorFormatado = formatarValor(updatedSolicitacao.valor);
            const mensagem = `Olá ${nomeCliente}, sua solicitação foi aprovada! Em breve entraremos em contato para agendar a instalação. Seu usuário PPPoE é: *${usuarioPppoe}* e a senha provisória é: *${senha}*. Valor do plano: ${valorFormatado}. Guarde estas informações!`;

            if (numero) {
                await enviarMensagemWhatsApp(numero, mensagem);
                alert("Solicitação aprovada e mensagem de WhatsApp enviada!");
            } else {
                alert("Solicitação aprovada, mas não foi possível enviar mensagem: número de contato não encontrado.");
            }
        } catch (error) {
            console.error("Erro ao aprovar solicitação:", error);
            alert("Erro ao aprovar solicitação.");
        }
    }

    async function naoAprovarSolicitacao(solicitacao) {
        try {
            await deleteDoc(doc(db, "solicitacoes-clientes", solicitacao.id));
            alert("Solicitação marcada como NÃO APROVADA e removida.");
        } catch (error) {
            console.error("Erro ao reprovar solicitação:", error);
            alert("Erro ao reprovar solicitação.");
        }
    }

    async function cadastrarClienteNoBanco(solicitacao, local) {
        try {
            // Re-generate PPPoE and senha if not already set (e.g., if coming directly from "Aguardando Instalação")
            const { usuarioPppoe, senha } = gerarPppoeESenha(
                solicitacao.nomeCompleto || solicitacao.nome,
                solicitacao.cpf,
                solicitacao.telefone || solicitacao.contato
            );

            const clienteParaCadastro = {
                ...solicitacao,
                status: "Não Ativado",
                valorPago: 0.00, // Default to 0.00 if not provided
                dataCadastro: new Date().toISOString(),
                usuarioPppoe: solicitacao.usuarioPppoe || usuarioPppoe, // Use existing if available, otherwise generate
                senha: solicitacao.senha || senha, // Use existing if available, otherwise generate
                velocidade: solicitacao.planoInteresse || solicitacao.plano || "N/A",
                numeroBanca: solicitacao.numeroBanca || "N/A",
                local: local.replace('-clientes', ''), // Adjust local name if necessary
                // Garante que o valor seja preservado
                valor: solicitacao.valor || solicitacao.valorPlano || 0,
            };

            await setDoc(doc(db, local, clienteParaCadastro.id), clienteParaCadastro);
            alert(`Cliente registrado em ${local} e aguardando ativação. Usuário PPPoE: ${clienteParaCadastro.usuarioPppoe}, Senha: ${clienteParaCadastro.senha}`);

            await deleteDoc(doc(db, "solicitacoes-clientes", solicitacao.id));
        } catch (error) {
            console.error("Erro ao cadastrar cliente:", error);
            alert("Erro ao cadastrar cliente.");
        }
    }

    return (
        <div className="p-4 max-w-full mx-auto overflow-x-auto">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">
                Solicitações de Internet ({solicitacoes.length})
            </h1>

            {solicitacoes.length === 0 ? (
                <p className="text-gray-600 mt-4">Nenhuma solicitação encontrada.</p>
            ) : (
                <>
                    {/* Display table only if there are solicitations for "feirinha" or "residencia" */}
                    {solicitacoes.some((s) => s.local === "feirinha" || s.local === "residencia") && (
                        <>
                            <h2 className="text-xl font-bold mt-8 mb-4 text-blue-700">
                                Clientes Pendentes de Ativação
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border-collapse border border-gray-300 shadow-sm rounded-lg">
                                    <thead className="bg-blue-100 text-blue-800">
                                        <tr>
                                            <th className="px-3 py-2 border text-left">NOME</th>
                                            <th className="px-3 py-2 border">CPF</th>
                                            <th className="px-3 py-2 border">CONTATO</th>
                                            <th className="px-3 py-2 border">NÚMERO</th>
                                            <th className="px-3 py-2 border">USUÁRIO PPPOE</th>
                                            <th className="px-3 py-2 border">SENHA PPPOE</th>
                                            <th className="px-3 py-2 border">VELOCIDADE</th>
                                            <th className="px-3 py-2 border">VALOR</th>
                                            <th className="px-3 py-2 border">PAGO</th>
                                            <th className="px-3 py-2 border">STATUS</th>
                                            <th className="px-3 py-2 border text-center">AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {solicitacoes
                                            .filter((s) => s.local === "feirinha" || s.local === "residencia")
                                            .map((s) => (
                                                <tr key={s.id} className="even:bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                                                    <td className="px-3 py-2 border text-left font-medium text-gray-900">
                                                        {s.nomeCompleto || s.nome || "N/A"}
                                                    </td>
                                                    <td className="px-3 py-2 border text-center text-gray-700">{s.cpf || "N/A"}</td>
                                                    <td className="px-3 py-2 border text-center text-gray-700">{s.telefone || s.contato || "N/A"}</td>
                                                    <td className="px-3 py-2 border text-center text-gray-700">{s.numeroBanca || "—"}</td>
                                                    <td className="px-3 py-2 border text-center text-gray-700">
                                                        {s.status === "Aguardando Instalação" ? s.usuarioPppoe : "—"}
                                                    </td>
                                                    <td className="px-3 py-2 border text-center text-gray-700">
                                                        {s.status === "Aguardando Instalação" ? s.senha : "—"}
                                                    </td>
                                                    <td className="px-3 py-2 border text-center text-gray-700">{s.planoInteresse || s.plano || "—"}</td>
                                                    <td className="px-3 py-2 border text-center text-gray-700 font-semibold">
                                                        {formatarValor(s.valor || s.valorPlano)}
                                                    </td>
                                                    <td className="px-3 py-2 border text-center capitalize">
                                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                            Não
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 border text-center capitalize">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.status === "Aguardando Instalação" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                                            {s.status || "Pendente"}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 border text-center whitespace-nowrap">
                                                        {s.status !== "Aguardando Instalação" ? (
                                                            <>
                                                                <button
                                                                    onClick={() => aprovarSolicitacao(s)}
                                                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                                                                >
                                                                    Aprovar
                                                                </button>
                                                                <button
                                                                    onClick={() => naoAprovarSolicitacao(s)}
                                                                    className="ml-2 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                                                                >
                                                                    Não Aprovar
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => cadastrarClienteNoBanco(s, s.local === "feirinha" ? "feirinha-clientes" : "residencia-clientes")}
                                                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                                                            >
                                                                Cadastrar Cliente
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}