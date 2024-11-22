"use client";

import React, { useState } from "react";
import { useSignMessage, useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PushAPI, CONSTANTS } from "@pushprotocol/restapi";
import { ethers } from "ethers";

export default function useSignMessageHook() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { address } = useAccount();
    const { signMessageAsync } = useSignMessage();

    async function triggerNotification() {
        try {
            setLoading(true);

            // Step 1: Sign the message
            const response = await signMessageAsync({ message: 'hello world' });
            console.log("Signed message response:", response);

            if (!address) {
                throw new Error("Address not available");
            }

            // Step 2: Generate QR code URL using a public QR code service
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}`;

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

    async function sendNotification(qrCodeUrl: string) {
        try {
            const signer = new ethers.Wallet(process.env.NEXT_PUBLIC_PVT_KEY as string);

            const user = await PushAPI.initialize(signer, {
                env: CONSTANTS.ENV.STAGING,
            });

            // await user.channel.create({
            //     name: 'Test Channel',
            //     description: 'Test Description',
            //     icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAz0lEQVR4AcXBsU0EQQyG0e+saWJ7oACiKYDMEZVs6GgSpC2BIhzRwAS0sgk9HKn3gpFOAv3v3V4/3+4U4Z1q5KTy42Ql940qvFONnFSGmCFmiN2+fj7uCBlihpgh1ngwcvKfwjuVIWaIGWKNB+GdauSk8uNkJfeNKryzYogZYoZY40m5b/wlQ8wQM8TayMlKeKcaOVkJ71QjJyuGmCFmiDUe+HFy4VyEd57hx0mV+0ZliBlihlgL71w4FyMnVXhnZeSkiu93qheuDDFDzBD7BcCyMAOfy204AAAAAElFTkSuQmCC',
            //     url: 'https://push.org',
            // });

            // Send the notification with the QR code URL
            await user.channel.send([address as string], {
                notification: {
                    title: "Your Public Key QR Code",
                    body: "Scan the QR code to access your public key."
                },
                payload: {
                    title: "Your Public Key QR Code",
                    body: "Scan the QR code to access your public key.",
                    cta: '',
                    embed: qrCodeUrl // Use the QR code service URL
                },
            });

            console.log("Notification sent with QR Code to:", address);
        } catch (error: any) {
            console.error("Error sending notification:", error);
            setError(error.message);
            throw error;
        }
    }

    return (
        <div className="container">
            <ConnectButton />
            <button onClick={triggerNotification} className="sign-button" disabled={loading}>
                {loading ? "Signing..." : "Sign message"}
            </button>
            {success && <p className="text-green-500 mt-2">Notification sent successfully!</p>}
            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
    );
}