"use client";

import { useState, useEffect } from "react";

type Token = {
    name: string;
    symbol: string;
    created: string | null; // ISO string format
};

export default function Page() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTokens() {
            try {
                const res = await fetch("http://localhost:3000/api/fetchTokens", {
                    cache: "no-store",
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch tokens");
                }

                const data = await res.json();
                console.log("Fetched Tokens from API:", data); // Debugging log
                setTokens(data);
            } catch (err: any) {
                console.error("Error fetching tokens:", err);
                setError("Failed to load tokens. Please try again later.");
            }
        }

        fetchTokens();
    }, []);

    return (
        <div
            style={{
                padding: "20px",
                fontFamily: "Courier New, monospace",
                color: "#0f0",
                backgroundColor: "#111",
                minHeight: "100vh",
            }}
        >
            <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
                Pump.fun Token Monitor
            </h1>
            {error ? (
                <p style={{ color: "red", textAlign: "center" }}>{error}</p>
            ) : (
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: "20px",
                    }}
                >
                    <thead>
                        <tr>
                            <th
                                style={{
                                    border: "1px solid #0f0",
                                    padding: "10px",
                                    backgroundColor: "#222",
                                }}
                            >
                                Token Name
                            </th>
                            <th
                                style={{
                                    border: "1px solid #0f0",
                                    padding: "10px",
                                    backgroundColor: "#222",
                                }}
                            >
                                Symbol
                            </th>
                            <th
                                style={{
                                    border: "1px solid #0f0",
                                    padding: "10px",
                                    backgroundColor: "#222",
                                }}
                            >
                                Created Time
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tokens.map((token, index) => (
                            <tr
                                key={index}
                                style={{
                                    textAlign: "left",
                                    backgroundColor: index % 2 === 0 ? "#333" : "#111",
                                }}
                            >
                                <td
                                    style={{
                                        border: "1px solid #0f0",
                                        padding: "10px",
                                    }}
                                >
                                    {token.name || "N/A"}
                                </td>
                                <td
                                    style={{
                                        border: "1px solid #0f0",
                                        padding: "10px",
                                    }}
                                >
                                    {token.symbol || "N/A"}
                                </td>
                                <td
                                    style={{
                                        border: "1px solid #0f0",
                                        padding: "10px",
                                    }}
                                >
                                    {token.created || "N/A"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
