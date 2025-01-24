"use client";

import { useState, useEffect } from "react";

type Token = {
  rank: number;
  name: string;
  symbol: string;
  mint: string;
  volume: number;
  createdAt: string;
};

export default function Page() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokens() {
      try {
        const res = await fetch("/api/fetchTokens", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch tokens");
        }

        const data = await res.json();
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
                Rank
              </th>
              <th
                style={{
                  border: "1px solid #0f0",
                  padding: "10px",
                  backgroundColor: "#222",
                }}
              >
                Name
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
                Volume
              </th>
              <th
                style={{
                  border: "1px solid #0f0",
                  padding: "10px",
                  backgroundColor: "#222",
                }}
              >
                Mint Address
              </th>
              <th
                style={{
                  border: "1px solid #0f0",
                  padding: "10px",
                  backgroundColor: "#222",
                }}
              >
                Created At
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
                  {token.rank}
                </td>
                <td
                  style={{
                    border: "1px solid #0f0",
                    padding: "10px",
                  }}
                >
                  {token.name}
                </td>
                <td
                  style={{
                    border: "1px solid #0f0",
                    padding: "10px",
                  }}
                >
                  {token.symbol}
                </td>
                <td
                  style={{
                    border: "1px solid #0f0",
                    padding: "10px",
                  }}
                >
                  {token.volume}
                </td>
                <td
                  style={{
                    border: "1px solid #0f0",
                    padding: "10px",
                  }}
                >
                  {token.mint}
                </td>
                <td
                  style={{
                    border: "1px solid #0f0",
                    padding: "10px",
                  }}
                >
                  {new Date(token.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
