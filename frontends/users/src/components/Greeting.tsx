import { useEffect } from 'react';
import { Box, Typography, TextField, Paper, Chip, Button, CircularProgress } from '@mui/material';
import { CheckCircle, Error as ErrorIcon, HelpOutline } from '@mui/icons-material';
import { useAppStore } from '@/store/appStore';

export default function Greeting() {
  const { greeting, setGreeting, apiHealthy, healthLoading, healthError, checkHealth } = useAppStore();

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {greeting}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Update greeting"
            variant="outlined"
            fullWidth
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          API Health
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {healthLoading ? (
            <Chip icon={<CircularProgress size={16} />} label="Checking..." variant="outlined" />
          ) : apiHealthy === true ? (
            <Chip icon={<CheckCircle />} label="API is healthy" color="success" variant="outlined" />
          ) : apiHealthy === false ? (
            <Chip icon={<ErrorIcon />} label={healthError || 'API unreachable'} color="error" variant="outlined" />
          ) : (
            <Chip icon={<HelpOutline />} label="Unknown" variant="outlined" />
          )}
          <Button size="small" variant="text" onClick={checkHealth} disabled={healthLoading}>
            Refresh
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
