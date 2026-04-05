import { Container, Typography, Box, AppBar, Toolbar } from '@mui/material';
import Greeting from './components/Greeting';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            App Template
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ mt: 4, flex: 1 }}>
        <Greeting />
      </Container>
    </Box>
  );
}

export default App;
