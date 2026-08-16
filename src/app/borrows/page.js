'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BorrowsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/my-borrows');
    }, [router]);

    return null;
}
