/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@material-ui/core';
import { useEffect, useRef } from 'react';

type FieldEditorDialogProps = {
  open: boolean;
  label?: string;
  value: string;
  onClose: () => void;
  onApply: (value: string) => void;
};

export const FieldEditorDialog = ({
  open,
  label,
  value,
  onClose,
  onApply,
}: FieldEditorDialogProps) => {
  const draftRef = useRef(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) {
      draftRef.current = value;
      if (inputRef.current) {
        inputRef.current.value = value;
      }
    }
  }, [open, value]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{label ? `Edit ${label}` : 'Edit field'}</DialogTitle>
      <DialogContent>
        <TextField
          multiline
          minRows={8}
          variant="outlined"
          defaultValue={value}
          inputRef={inputRef}
          onChange={event => {
            draftRef.current = event.target.value;
          }}
          fullWidth
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="primary"
          variant="contained"
          onClick={() => onApply(draftRef.current ?? value)}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};
