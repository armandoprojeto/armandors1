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
        throw error; // Re-throw para que o chamador possa lidar com o erro
    }
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

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
        };
    }, [navigate]);

    // Função para gerar o usuário PPPoE e senha
    const gerarPppoeESenha = (nome, cpf, contato) => {
        // Gera o usuário PPPoE (3 primeiras letras do nome + 3 números aleatórios)
        const usuarioPppoe = `${(nome || '').substring(0, 3).toLowerCase()}${Math.floor(Math.random() * 1000)}`;

        let senha = '';
        const cpfLimpo = (cpf || '').replace(/\D/g, ''); // Remove caracteres não numéricos do CPF
        const contatoLimpo = (contato || '').replace(/\D/g, ''); // Remove caracteres não numéricos do contato

        const ultimos3Cpf = cpfLimpo.slice(-3); // Pega os últimos 3 dígitos do CPF
        const ultimos3Contato = contatoLimpo.slice(-3); // Pega os últimos 3 dígitos do Contato

        // Concatena para formar a senha. Se algum não tiver 3 dígitos, pega o que tiver.
        senha = `${ultimos3Cpf}${ultimos3Contato}`;

        // Garante que a senha não fique vazia se CPF/Contato estiverem ausentes ou curtos
        if (senha.length < 3) {
            senha += Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // Adiciona 3 dígitos aleatórios
            senha = senha.substring(0, 6); // Limita para um tamanho razoável se for aleatório
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

            const updatedSolicitacao = {
                ...solicitacao,
                status: "Aguardando Instalação",
                usuarioPppoe,
                senha,
            };

            await setDoc(doc(db, "solicitacoes-clientes", solicitacao.id), updatedSolicitacao);

            const numero = (solicitacao.telefone || solicitacao.contato || '').replace(/\D/g, "");
            const nomeCliente = solicitacao.nomeCompleto || solicitacao.nome || "Cliente";
            const mensagem = `Olá ${nomeCliente}, sua solicitação foi aprovada! Em breve entraremos em contato para agendar a instalação. Seu usuário PPPoE é: *${usuarioPppoe}* e a senha provisória é: *${senha}*. Guarde estas informações!`;

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
            const { usuarioPppoe, senha } = gerarPppoeESenha(
                solicitacao.nomeCompleto || solicitacao.nome,
                solicitacao.cpf,
                solicitacao.telefone || solicitacao.contato
            );

            const clienteParaCadastro = {
                ...solicitacao,
                status: "Não Ativado",
                valorPago: 0.00,
                dataCadastro: new Date().toISOString(),
                usuarioPppoe: solicitacao.usuarioPppoe || usuarioPppoe, // Usa o que já existe ou gera novo
                senha: solicitacao.senha || senha,                     // Usa o que já existe ou gera novo
                velocidade: solicitacao.planoInteresse || solicitacao.plano || "N/A", // Salvar como 'velocidade'
                numeroBanca: solicitacao.numeroBanca || "N/A",
                local: local.replace('-clientes', '') // Salva 'feirinha' ou 'residencia'
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
                    {solicitacoes.some((s) => s.local === "feirinha" || s.local === "residencia") && (
                        <>
                            <h2 className="text-xl font-bold mt-8 mb-4 text-blue-700">
                                Clientes Pendentes de Ativação
                            </h2>
                            <table className="min-w-full bg-white border-collapse border border-gray-300 shadow-sm rounded-lg">
                                <thead className="bg-blue-100 text-blue-800">
                                    <tr>
                                        <th className="px-3 py-2 border text-left">NOME</th>
                                        <th className="px-3 py-2 border">CPF</th>
                                        <th className="px-3 py-2 border">CONTATO</th>
                                        <th className="px-3 py-2 border">NÚMERO</th> {/* Corresponde a numeroBanca */}
                                        <th className="px-3 py-2 border">USUÁRIO PPPOE</th>
                                        <th className="px-3 py-2 border">SENHA PPPOE</th>
                                        <th className="px-3 py-2 border">VELOCIDADE</th> {/* Corresponde a planoInteresse/plano */}
                                        <th className="px-3 py-2 border">VALOR</th> {/* Será 0,00 para solicitações */}
                                        <th className="px-3 py-2 border">PAGO</th> {/* Será "Não" para solicitações */}
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
                                                <td className="px-3 py-2 border text-center text-gray-700">{s.numeroBanca || "—"}</td> {/* Exibindo numeroBanca */}
                                                <td className="px-3 py-2 border text-center text-gray-700">
                                                    {s.status === "Aguardando Instalação" ? s.usuarioPppoe : "—"}
                                                </td>
                                                <td className="px-3 py-2 border text-center text-gray-700">
                                                    {s.status === "Aguardando Instalação" ? s.senha : "—"}
                                                </td>
                                                <td className="px-3 py-2 border text-center text-gray-700">{s.planoInteresse || s.plano || "—"}</td> {/* Exibindo plano/velocidade */}
                                                <td className="px-3 py-2 border text-center text-gray-700">
                                                    R$ 0,00 {/* Sempre 0,00 para solicitações */}
                                                </td>
                                                <td className="px-3 py-2 border text-center capitalize">
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                        Não {/* Sempre "Não" para solicitações */}
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
                        </>
                    )}
                </>
            )}
        </div>
    );
}