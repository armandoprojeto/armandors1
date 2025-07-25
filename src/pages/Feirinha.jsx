// ... Importações
import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import {
    FaEdit,
    FaTrashAlt,
    FaCheck,
    FaTimes,
    FaMoneyBillWave
} from "react-icons/fa";

export default function FeirinhaClientes() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        carregarClientes();
    }, []);

    async function carregarClientes() {
        setLoading(true);
        try {
            const refFeirinha = collection(db, "feirinha-clientes");
            const refResidencia = collection(db, "residencia-clientes");

            const [snapFeirinha, snapResidencia] = await Promise.all([
                getDocs(refFeirinha),
                getDocs(refResidencia),
            ]);

            const dadosFeirinha = snapFeirinha.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const dadosResidencia = snapResidencia.docs.map(doc => doc.data());

            const cpfsComPontoNaoCortesia = new Set();
            [...dadosFeirinha, ...dadosResidencia].forEach(cliente => {
                if (cliente.status !== "cortesia" && cliente.cpf) {
                    cpfsComPontoNaoCortesia.add(cliente.cpf);
                }
            });

            const clientesValidos = dadosFeirinha.filter(cliente =>
                cpfsComPontoNaoCortesia.has(cliente.cpf)
            );

            setClientes(clientesValidos);
        } catch (error) {
            alert("Erro ao carregar clientes. Verifique o console.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function excluirCliente(id) {
        if (!window.confirm("Deseja excluir esse cliente?")) return;
        try {
            await deleteDoc(doc(db, "feirinha-clientes", id));
            setClientes((old) => old.filter((c) => c.id !== id));
        } catch (error) {
            alert("Erro ao excluir cliente.");
        }
    }

    async function toggleStatus(cliente) {
        try {
            let novoStatus = cliente.status === "ativado"
                ? "desativado"
                : cliente.status === "desativado"
                    ? "cortesia"
                    : "ativado";

            await updateDoc(doc(db, "feirinha-clientes", cliente.id), {
                status: novoStatus,
            });
            setClientes((old) =>
                old.map((c) => (c.id === cliente.id ? { ...c, status: novoStatus } : c))
            );
        } catch (error) {
            alert("Erro ao atualizar status.");
        }
    }

    async function togglePagamento(cliente) {
        try {
            if (cliente.status === "cortesia") return;
            const novoPago = cliente.pago === "sim" ? "não" : "sim";
            await updateDoc(doc(db, "feirinha-clientes", cliente.id), {
                pago: novoPago,
            });
            setClientes((old) =>
                old.map((c) => (c.id === cliente.id ? { ...c, pago: novoPago } : c))
            );
        } catch (error) {
            alert("Erro ao atualizar pagamento.");
        }
    }

    function formatarValor(valor) {
        const numero = Number(valor);
        return isNaN(numero)
            ? "R$ 0,00"
            : numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    async function handleGerarPix(cpfCliente) {
        try {
            const refFeirinha = collection(db, "feirinha-clientes");
            const refResidencia = collection(db, "residencia-clientes");

            const q1 = query(refFeirinha, where("cpf", "==", cpfCliente));
            const q2 = query(refResidencia, where("cpf", "==", cpfCliente));

            const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

            const todosPontos = [...snap1.docs, ...snap2.docs].map(doc => doc.data());

            const valorTotal = todosPontos
                .filter(p => p.status !== "cortesia")
                .reduce((soma, atual) => soma + Number(atual.valor || 0), 0);

            if (valorTotal <= 0) {
                alert("Cliente com todos os pontos cortesia ou sem valor a pagar.");
                return;
            }

            navigate(`/gerar-pix?cpf=${cpfCliente}&valor=${valorTotal}`);
        } catch (error) {
            alert("Erro ao gerar Pix.");
        }
    }

    const filteredClientes = clientes.filter((cliente) =>
        Object.values(cliente).some((value) =>
            typeof value === "string" &&
            value.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    if (loading) return <p>Carregando...</p>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-left mb-4 text-black bg-transparent">Feirinha</h2>

            <div className="mb-4 flex justify-start">
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    className="border px-4 py-2 rounded shadow w-[30%]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-center border border-gray-300 table-fixed">
                    <thead className="bg-gray-100 text-base">
                        <tr>
                            <th className="text-left pl-2 w-[300px] border border-gray-300">Nome</th>
                            <th className="border border-gray-300 px-6">CPF</th>
                            <th className="border border-gray-300 px-6">Contato</th>
                            <th className="border border-gray-300 px-6">Usuário</th>
                            <th className="border border-gray-300 px-6">Senha</th>
                            <th className="border border-gray-300 px-6">Velocidade</th>
                            <th className="border border-gray-300 px-6">Valor</th>
                            <th className="border border-gray-300 px-6">Pago</th>
                            <th className="border border-gray-300 px-6">Status</th>
                            <th className="border border-gray-300 px-6">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClientes.map((cliente) => (
                            <tr key={cliente.id} className="border border-gray-300 h-[60px]">
                                <td className="text-left pl-2 border border-gray-300 whitespace-nowrap truncate font-semibold">{cliente.nome}</td>
                                <td className="border border-gray-300 px-6 whitespace-nowrap">{cliente.cpf}</td>
                                <td className="border border-gray-300 px-6 whitespace-nowrap">{cliente.contato}</td>
                                <td className="border border-gray-300 px-6 whitespace-nowrap">{cliente.usuarioPppoe}</td>
                                <td className="border border-gray-300 px-6 whitespace-nowrap">{cliente.senha}</td>
                                <td className="border border-gray-300 px-6 whitespace-nowrap">{cliente.velocidade}</td>
                                <td className="border border-gray-300 px-6 whitespace-nowrap">{formatarValor(cliente.valor)}</td>
                                <td className="border border-gray-300 px-6 whitespace-nowrap">
                                    {cliente.status === "cortesia" ? (
                                        <span className="text-yellow-600 font-semibold">Cortesia</span>
                                    ) : (
                                        <button
                                            onClick={() => togglePagamento(cliente)}
                                            className={`px-2 py-1 rounded text-white text-xs ${cliente.pago === "sim" ? "bg-green-500" : "bg-red-500"}`}
                                        >
                                            {cliente.pago === "sim" ? "Sim" : "Não"}
                                        </button>
                                    )}
                                </td>
                                <td className="border border-gray-300 px-6 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-white text-xs ${cliente.status === "ativado" ? "bg-green-500" : cliente.status === "desativado" ? "bg-red-500" : "bg-yellow-500"}`}>
                                        {cliente.status === "ativado" ? "Ativado" : cliente.status === "desativado" ? "Desativado" : "Cortesia"}
                                    </span>
                                </td>
                                <td className="border border-gray-300 px-6 whitespace-nowrap">
                                    <div className="flex gap-1 flex-wrap justify-center">
                                        <button onClick={() => navigate(`/editar/${cliente.id}/feirinha`)} className="bg-blue-500 text-white p-2 rounded">
                                            <FaEdit size={14} />
                                        </button>
                                        <button onClick={() => excluirCliente(cliente.id)} className="bg-red-500 text-white p-2 rounded">
                                            <FaTrashAlt size={14} />
                                        </button>
                                        <button onClick={() => toggleStatus(cliente)} className={`text-white p-2 rounded ${cliente.status === "ativado" ? "bg-green-500" : cliente.status === "desativado" ? "bg-red-500" : "bg-yellow-500"}`}>
                                            {cliente.status === "ativado" ? <FaCheck size={14} /> : cliente.status === "desativado" ? <FaTimes size={14} /> : <FaCheck size={14} />}
                                        </button>
                                        <button onClick={() => handleGerarPix(cliente.cpf)} className="bg-yellow-500 text-white p-2 rounded">
                                            <FaMoneyBillWave size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
