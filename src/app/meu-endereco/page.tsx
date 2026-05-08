'use client';

import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { lookupCep } from '@/lib/viaCep';
import { motion } from 'framer-motion';

interface AddressForm {
  name: string; email: string; document: string; company_name: string;
  shipping_zipcode: string; shipping_street: string; shipping_number: string;
  shipping_complement: string; shipping_city: string; shipping_state: string;
}

const initialForm: AddressForm = {
  name: '', email: '', document: '', company_name: '',
  shipping_zipcode: '', shipping_street: '', shipping_number: '',
  shipping_complement: '', shipping_city: '', shipping_state: '',
};

const fieldClass = 'h-11 rounded-xl text-sm';

export default function MeuEnderecoPage() {
  const { user, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<AddressForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [zipError, setZipError] = useState('');
  const [addressLookupPending, setAddressLookupPending] = useState(false);
  const [lastFetchedZip, setLastFetchedZip] = useState('');

  useEffect(() => {
    if (!loading && !user) { router.push('/auth'); return; }
    if (user) {
      setForm({
        name: user.name || '', email: user.email || '',
        document: user.document || '', company_name: user.company_name || '',
        shipping_zipcode: user.shipping_zipcode || '',
        shipping_street: user.shipping_street || '',
        shipping_number: user.shipping_number || '',
        shipping_complement: user.shipping_complement || '',
        shipping_city: user.shipping_city || '',
        shipping_state: user.shipping_state || '',
      });
    }
  }, [user, loading, router]);

  useEffect(() => {
    const cepDigits = form.shipping_zipcode.replace(/\D/g, '');
    if (cepDigits.length !== 8 || cepDigits === lastFetchedZip) return;
    const fetchAddress = async () => {
      setZipError('');
      setAddressLookupPending(true);
      try {
        const result = await lookupCep(cepDigits);
        if (!result) { setZipError('CEP inválido ou não encontrado.'); return; }
        setForm((cur) => ({
          ...cur, shipping_zipcode: result.cep,
          shipping_street: result.logradouro || cur.shipping_street,
          shipping_city: result.localidade || cur.shipping_city,
          shipping_state: result.uf || cur.shipping_state,
        }));
        setLastFetchedZip(cepDigits);
      } catch { setZipError('Não foi possível buscar o endereço pelo CEP.'); }
      finally { setAddressLookupPending(false); }
    };
    fetchAddress();
  }, [form.shipping_zipcode, lastFetchedZip]);

  const handleChange = (field: keyof AddressForm, value: string) => {
    if (field === 'shipping_zipcode') setZipError('');
    setForm((cur) => ({ ...cur, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, document: form.document, company_name: form.company_name,
          shipping_zipcode: form.shipping_zipcode, shipping_street: form.shipping_street,
          shipping_number: form.shipping_number, shipping_complement: form.shipping_complement,
          shipping_city: form.shipping_city, shipping_state: form.shipping_state,
          shipping_country: 'BR',
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        toast({ title: 'Erro', description: error?.error || 'Não foi possível salvar seus dados.', variant: 'destructive' });
        return;
      }
      await refreshProfile();
      toast({ title: 'Salvo!', description: 'Endereço atualizado com sucesso.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar seu endereço.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 md:py-20 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 md:mb-10"
        >
          <span className="text-[11px] font-bold text-primary uppercase tracking-[0.12em]">Conta</span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Meu Endereço</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Atualize seus dados pessoais e endereço de entrega.
          </p>
        </motion.div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Dados pessoais */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Dados Pessoais</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">Nome</Label>
                <Input id="name" className={fieldClass} value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">E-mail</Label>
                <Input id="email" className={fieldClass} value={form.email} disabled />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="document" className="text-sm">CPF ou CNPJ</Label>
                <Input id="document" className={fieldClass} value={form.document} onChange={(e) => handleChange('document', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company_name" className="text-sm text-muted-foreground">Empresa (opcional)</Label>
                <Input id="company_name" className={fieldClass} value={form.company_name} onChange={(e) => handleChange('company_name', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Endereço de Entrega</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="shipping_zipcode" className="text-sm">CEP</Label>
                <Input id="shipping_zipcode" className={fieldClass} placeholder="00000-000" value={form.shipping_zipcode} onChange={(e) => handleChange('shipping_zipcode', e.target.value)} required />
                {addressLookupPending && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
                {zipError && <p className="text-xs text-destructive">{zipError}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shipping_city" className="text-sm">Cidade</Label>
                <Input id="shipping_city" className={fieldClass} value={form.shipping_city} onChange={(e) => handleChange('shipping_city', e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="shipping_street" className="text-sm">Rua</Label>
                <Input id="shipping_street" className={fieldClass} value={form.shipping_street} onChange={(e) => handleChange('shipping_street', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shipping_state" className="text-sm">Estado</Label>
                <Input id="shipping_state" className={fieldClass} placeholder="UF" value={form.shipping_state} onChange={(e) => handleChange('shipping_state', e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="shipping_number" className="text-sm">Número</Label>
                <Input id="shipping_number" className={fieldClass} value={form.shipping_number} onChange={(e) => handleChange('shipping_number', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shipping_complement" className="text-sm text-muted-foreground">Complemento (opcional)</Label>
                <Input id="shipping_complement" className={fieldClass} placeholder="Apto, bloco..." value={form.shipping_complement} onChange={(e) => handleChange('shipping_complement', e.target.value)} />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 rounded-xl font-semibold" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
