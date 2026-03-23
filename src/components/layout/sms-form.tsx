'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '../ui/card';

type ServiceType = '150' | '640';

const phoneRegex = /^0\d{9}$/;

export default function SmsForm() {
    const [serviceType, setServiceType] = useState<ServiceType>('150');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');

    const is150 = serviceType === '150';

    const phoneError = useMemo(() => {
        if (phone && !phoneRegex.test(phone)) {
            return 'Номер має починатися з 0 і містити 10 цифр.';
        }
        return '';
    }, [phone]);

    const codeError = useMemo(() => {
        if (is150) {
            const numericCode = Number(code);
            if (code && (isNaN(numericCode) || numericCode < 0 || numericCode > 1000)) {
                return 'Код має бути числом від 0 до 1000.';
            }
        }
        return '';
    }, [code, is150]);

    const isFormValid = useMemo(() => {
        if (!phone || phoneError) return false;
        if (is150 && (!code || codeError)) return false;
        return true;
    }, [phone, phoneError, code, codeError, is150]);


    useEffect(() => {
        setPhone('');
        setCode('');
    }, [serviceType]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isFormValid) return;

        let smsLink = '';
        if (is150) {
             smsLink = `sms:${serviceType}?body=${phone}*${code}`;
        } else {
             smsLink = `sms:${serviceType}?body=${phone}`;
        }
        window.location.href = smsLink;
    }
    
    const errorMessage = phoneError || (is150 ? codeError : '');

    return (
        <div className="flex flex-col items-center justify-center p-0 h-[calc(100vh-280px)]">
            <Card className="w-full max-w-sm bg-transparent border-none">
                <CardContent className="p-0">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setServiceType('150')}
                                className={cn(
                                    "h-12 text-lg transition-all sms-btn !rounded-xl",
                                    serviceType === '150' && 'active'
                                )}
                            >
                                Сервіс 150
                            </button>
                            <button
                                type="button"
                                onClick={() => setServiceType('640')}
                                 className={cn(
                                    "h-12 text-lg transition-all sms-btn !rounded-xl",
                                    serviceType === '640' && 'active'
                                )}
                            >
                                Сервіс 640
                            </button>
                        </div>

                        <div className="space-y-4 mt-8">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Номер телефону</Label>
                                <Input 
                                    id="phone"
                                    type="tel" 
                                    placeholder="0991234567" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="h-12 text-lg" 
                                />
                            </div>

                            <div className={cn(
                                "space-y-2 transition-opacity duration-300",
                                !is150 && "opacity-0 pointer-events-none"
                            )}>
                                <Label htmlFor="code">Код</Label>
                                <Input 
                                    id="code"
                                    type="number" 
                                    placeholder="напр. 900" 
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="h-12 text-lg" 
                                    disabled={!is150}
                                />
                            </div>
                        </div>

                        <div className="flex-grow"></div>

                        <div className="h-5 mb-2 text-center">
                            {errorMessage && <p className="text-sm font-medium text-destructive">{errorMessage}</p>}
                        </div>
                        
                        <button
                            type="submit"
                            className={cn('glass-card achieved w-full !rounded-xl !p-3 text-center font-bold text-lg', !isFormValid && 'opacity-50 cursor-not-allowed')}
                            disabled={!isFormValid}
                        >
                            Підтвердити
                        </button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
