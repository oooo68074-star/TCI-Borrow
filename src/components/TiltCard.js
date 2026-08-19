'use client';

import { useRef, useState, useEffect } from 'react';

export default function TiltCard({ children, className = '', ...props }) {
    const cardRef = useRef(null);
    const [style, setStyle] = useState({});
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();

        // Calculate mouse position relative to the card
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate center of the card
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation (max 20 degrees for more pronounced tilt)
        const rotateX = ((y - centerY) / centerY) * -20;
        const rotateY = ((x - centerX) / centerX) * 20;

        // Calculate glare positions
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;

        setStyle({
            transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`,
            '--glare-x': `${glareX}%`,
            '--glare-y': `${glareY}%`,
        });
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        // Reset translation and rotation gracefully
        setStyle({
            transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            '--glare-x': '50%',
            '--glare-y': '50%',
            transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
        });
    };

    return (
        <div
            ref={cardRef}
            className={`tilt-card ${className}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                ...style,
                transition: isHovered ? 'none' : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
            {...props}
        >
            {children}
            <div className={`tilt-glare ${isHovered ? 'active' : ''}`} style={style} />
        </div>
    );
}
