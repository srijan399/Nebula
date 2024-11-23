"use client";

import React, { useState, useEffect } from "react";
import { useSignMessage, useAccount, useWalletClient, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PushAPI, CONSTANTS } from "@pushprotocol/restapi";

// Channel address for different networks
const CHANNEL_ADDRESSES = {
    SEPOLIA: "0xF5E93e4eEDbb1235B0FB200fd77068Cb9938eF4f",
    BASE_SEPOLIA: "0xF5E93e4eEDbb1235B0FB200fd77068Cb9938eF4f", // Replace with your Base Sepolia channel address
};

export default function UseSignMessageHook() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [pushUser, setPushUser] = useState<any>(null);
    const { address } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const { data: walletClient } = useWalletClient();
    const chainId = useChainId();

    // Function to get the correct channel address based on the network
    const getChannelAddress = () => {
        if (chainId === 11155111) {
            return CHANNEL_ADDRESSES.SEPOLIA;
        } else if (chainId === 84532) {
            return CHANNEL_ADDRESSES.BASE_SEPOLIA;
        }
        throw new Error("Unsupported network. Please connect to Sepolia or Base Sepolia.");
    };

    // Reinitialize Push SDK on wallet or chain switch
    useEffect(() => {
        if (walletClient && chainId) {
            PushAPI.initialize(walletClient, {
                env: CONSTANTS.ENV.STAGING, // Ensure correct environment
            })
                .then((user) => {
                    console.log("Push User reinitialized for chainId:", chainId);
                    setPushUser(user);
                })
                .catch((err) => {
                    console.error("Error reinitializing Push User:", err);
                });
        }
    }, [walletClient, chainId]);

    // Trigger notification process
    async function triggerNotification() {
        try {
            setLoading(true);

            if (!address || !walletClient) {
                throw new Error("Please connect your wallet first");
            }

            // Step 1: Sign the message
            const response = await signMessageAsync({ message: "hello world" });
            console.log("Signed message response:", response);

            // Step 2: Generate QR code URL
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                address
            )}`;

            // Step 3: Send the notification
            await sendNotification(qrCodeUrl);
            setSuccess(true);
        } catch (error: any) {
            console.error("Error during signing or notification:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    // Send notification
    async function sendNotification(qrCodeUrl: string) {
        try {
            if (!pushUser) {
                throw new Error("Push User not initialized");
            }

            if (!chainId) {
                throw new Error("No chain selected");
            }

            console.log(`Active chainId: ${chainId}`); // Debugging step

            const channelAddress = getChannelAddress();
            const subscriptionString = `eip155:${chainId}:${channelAddress}`;

            console.log("Subscribing to:", subscriptionString);

            // Subscribe to the channel
            await pushUser.notification.subscribe(subscriptionString);

            // Send the notification
            await pushUser.channel.send([address as string], {
                notification: {
                    title: "Your Public Key QR Code",
                    body: "Scan the QR code to access your public key.",
                },
                payload: {
                    title: "Your Public Key QR Code",
                    body: "Scan the QR code to access your public key.",
                    cta: "",
                    embed: qrCodeUrl,
                },
            });

            console.log("Notification sent with QR Code to:", address);
        } catch (error: any) {
            console.error("Error sending notification:", error);
            setError(error.message);
            throw error;
        }
    }

    // Get network status message
    const getNetworkMessage = () => {
        if (!chainId) return "Please connect your wallet";
        if (chainId !== 11155111 && chainId !== 84532) {
            return "Please switch to Sepolia or Base Sepolia network";
        }
        return null;
    };

    const networkMessage = getNetworkMessage();

    return (
        <div className="container">
            <ConnectButton />
            {networkMessage && (
                <p className="text-yellow-500 mt-2">{networkMessage}</p>
            )}
            <button
                onClick={triggerNotification}
                className="sign-button"
                disabled={loading || !address || !!networkMessage}
            >
                {loading ? "Signing..." : "Sign message"}
            </button>
            {success && (
                <p className="text-green-500 mt-2">Notification sent successfully!</p>
            )}
            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
    );
}