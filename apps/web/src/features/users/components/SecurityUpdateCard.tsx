import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input } from '@ube-hr/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@ube-hr/ui';
import {
  requestVerificationCodeForUser,
  verifyAndUpdateContactForUser,
} from '../users.api';
import { useUser, userKeys } from '../users.queries';
import { useQueryClient } from '@tanstack/react-query';

type ContactType = 'EMAIL' | 'PHONE';

export function SecurityUpdateCard({ userId }: { userId: number }) {
  const qc = useQueryClient();
  const { data: user } = useUser(userId);
  const [type, setType] = useState<ContactType>('EMAIL');
  const [value, setValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setValue(type === 'EMAIL' ? user.email || '' : user.phone || '');
    }
  }, [user, type]);

  useEffect(() => {
    setError(null);
  }, [value, code]);

  const currentValue = type === 'EMAIL' ? user?.email : user?.phone;
  const hasChanged = value !== currentValue;

  const handleSaveClick = async () => {
    if (!value) {
      return;
    }
    setError(null);
    setIsPending(true);
    try {
      await requestVerificationCodeForUser(userId, type);
      setIsVerifying(true);
    } catch (e) {
      setError('Failed to send security code. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  const handleVerifyAndSave = async () => {
    if (!code) {
      return;
    }
    setError(null);
    setIsPending(true);
    try {
      await verifyAndUpdateContactForUser(userId, { type, code, value });
      await qc.invalidateQueries({ queryKey: userKeys.detail(userId) });
      setIsSuccess(true);
      setIsVerifying(false);
      setCode('');
    } catch (e) {
      setError('Invalid security code or update failed. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !isSuccess) {
      setValue(type === 'EMAIL' ? user?.email || '' : user?.phone || '');
    }
    if (!open) setIsSuccess(false);
    setIsVerifying(open);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-sm font-semibold mb-4">Security Settings</h2>
        <div className="flex gap-4 mb-4">
          <Button
            variant={type === 'EMAIL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setType('EMAIL')}
          >
            Email
          </Button>
          <Button
            variant={type === 'PHONE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setType('PHONE')}
          >
            Phone
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder={
                type === 'EMAIL' ? 'email@example.com' : '+123456789'
              }
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {error && !isVerifying && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleSaveClick}
            disabled={isPending || !hasChanged}
          >
            {isPending ? 'Processing...' : 'Save'}
          </Button>
        </div>

        <Dialog open={isVerifying} onOpenChange={handleDialogClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Security Verification</DialogTitle>
              <DialogDescription>
                Enter the 6-digit security code sent to your admin account to
                confirm the update of {type.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              {error && isVerifying && (
                <p className="text-xs text-destructive mt-1 text-center">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsVerifying(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleVerifyAndSave}
                disabled={isPending || !code}
              >
                {isPending ? 'Verifying...' : 'Verify & Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
