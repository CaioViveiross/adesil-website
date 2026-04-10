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

interface AddressForm {
  name: string;
  email: string;
  document: string;
  company_name: string;
  shipping_zipcode: string;
  shipping_street: string;
  shipping_number: string;
  shipping_complement: string;
  shipping_city: string;
  shipping_state: string;
}

const initialForm: AddressForm = {
  name: '',
  email: '',
  document: '',
  company_name: '',
  shipping_zipcode: '',
  shipping_street: '',
  shipping_number: '',
  shipping_complement: '',
  shipping_city: '',
  shipping_state: '',
};

export default function MeuEnderecoPage() {
  const { user, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<AddressForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [zipError, setZipError] = useState('');
  const [addressLookupPending, setAddressLookupPending] = useState(false);
  const [lastFetchedZip, setLastFetchedZip] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
      return;
    }

    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        document: user.document || '',
        company_name: user.company_name || '',
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
    if (cepDigits.length !== 8 || cepDigits === lastFetchedZip) {
      return;
    }

    const fetchAddress = async () => {
      setZipError('');
      setAddressLookupPending(true);

      try {
        const result = await lookupCep(cepDigits);
        if (!result) {
          setZipError('CEP inválido ou não encontrado.');
          return;
        }

        setForm((current) => ({
          ...current,
          shipping_zipcode: result.cep,
          shipping_street: result.logradouro || current.shipping_street,
          shipping_city: result.localidade || current.shipping_city,
          shipping_state: result.uf || current.shipping_state,
        }));
        setLastFetchedZip(cepDigits);
      } catch (error) {
        console.error('ViaCep lookup error:', error);
        setZipError('Não foi possível buscar o endereço pelo CEP.');
      } finally {
        setAddressLookupPending(false);
      }
    };

    fetchAddress();
  }, [form.shipping_zipcode, lastFetchedZip]);

  const handleChange = (field: keyof AddressForm, value: string) => {
    if (field === 'shipping_zipcode') {
      setZipError('');
    }

    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          document: form.document,
          company_name: form.company_name,
          shipping_zipcode: form.shipping_zipcode,
          shipping_street: form.shipping_street,
          shipping_number: form.shipping_number,
          shipping_complement: form.shipping_complement,
          shipping_city: form.shipping_city,
          shipping_state: form.shipping_state,
          shipping_country: 'BR',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({ title: 'Erro', description: error?.error || 'Não foi possível salvar seus dados.', variant: 'destructive' });
        return;
      }

      await refreshProfile();
      toast({ title: 'Sucesso', description: 'Endereço salvo com sucesso.' });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Erro', description: 'Falha ao salvar seu endereço.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Carregando seus dados...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-16 max-w-3xl">
        <div className="space-y-6 bg-card border rounded-3xl p-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Meu Endereço</h1>
            <p className="text-muted-foreground">Atualize seu endereço e CPF/CNPJ para futuras compras.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={form.email} disabled />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="document">CPF ou CNPJ</Label>
                <Input
                  id="document"
                  value={form.document}
                  onChange={(e) => handleChange('document', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="company_name">Empresa (opcional)</Label>
                <Input
                  id="company_name"
                  value={form.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                />
              </div>
            </div>

            <fieldset className="space-y-4 border p-4 rounded-3xl">
              <legend className="text-lg font-semibold">Endereço de Entrega</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="shipping_zipcode">CEP</Label>
                  <Input
                    id="shipping_zipcode"
                    value={form.shipping_zipcode}
                    onChange={(e) => handleChange('shipping_zipcode', e.target.value)}
                    required
                  />
                  {addressLookupPending && (
                    <p className="mt-1 text-sm text-muted-foreground">Buscando endereço pelo CEP...</p>
                  )}
                  {zipError && (
                    <p className="mt-1 text-sm text-destructive">{zipError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="shipping_city">Cidade</Label>
                  <Input
                    id="shipping_city"
                    value={form.shipping_city}
                    onChange={(e) => handleChange('shipping_city', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="shipping_street">Rua</Label>
                  <Input
                    id="shipping_street"
                    value={form.shipping_street}
                    onChange={(e) => handleChange('shipping_street', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shipping_number">Número</Label>
                  <Input
                    id="shipping_number"
                    value={form.shipping_number}
                    onChange={(e) => handleChange('shipping_number', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="shipping_complement">Complemento</Label>
                  <Input
                    id="shipping_complement"
                    value={form.shipping_complement}
                    onChange={(e) => handleChange('shipping_complement', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="shipping_state">Estado</Label>
                  <Input
                    id="shipping_state"
                    value={form.shipping_state}
                    onChange={(e) => handleChange('shipping_state', e.target.value)}
                    required
                  />
                </div>
              </div>
            </fieldset>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Endereço'}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
