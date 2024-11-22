"use client";

import { useSignTypedData } from 'wagmi'


export default function App() {
    const { signTypedData, signTypedDataAsync } = useSignTypedData();

    async function triggerNotification() {
        const response = await signTypedDataAsync({
            types: {
                Person: [
                    { name: 'name', type: 'string' },
                    { name: 'wallet', type: 'address' },
                ],
                Mail: [
                    { name: 'from', type: 'Person' },
                    { name: 'to', type: 'Person' },
                    { name: 'contents', type: 'string' },
                ],
            },
            primaryType: 'Mail',
            message: {
                from: {
                    name: 'Cow',
                    wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
                },
                to: {
                    name: 'Bob',
                    wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                },
                contents: 'Hello, Bob!',
            },
        });

        console.log("response:", response);
    }

    return (
        <button
            onClick={triggerNotification}
        >
            Sign message
        </button>
    )
}