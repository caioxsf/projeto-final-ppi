import express from 'express';
import path from 'path';
import session from 'express-session';
import { resolveSoa } from 'dns';
import cookieParser from 'cookie-parser';

const host = '0.0.0.0';
const porta = 3000;

const app = express();
const listaInteressados = [];
const listaPets = [];
const listaAdocao = [];

app.use(session({
    secret: 'chavescreta',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 30
    }
}));

app.use(cookieParser());

app.use(express.static(path.join(process.cwd(), 'publico')));

app.use(express.urlencoded({extendend: true}));

function usuarioEstaAutenticado (requisicao, resposta, next)
{
    if(requisicao.session.usuarioAutenticado)
    {
        next();
    }
    else
    {
        resposta.redirect('/login.html');
    }
}

function autenticarUsuario(requisicao, resposta)
{   
    const usuario = requisicao.body.user;
    const senha = requisicao.body.senha;
    if(usuario == 'admin' && senha == '123')
    {
        requisicao.session.usuarioAutenticado = true;
        resposta.cookie('dataUltimoAcesso', new Date().toLocaleString(), {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 30
        });
        resposta.redirect('/menu.html');
    }
    else
    {
        resposta.write('<!DOCTYPE html>');
        resposta.write('<html>');
        resposta.write('<head>');
        resposta.write('<meta charset="UTF-8">');
        resposta.write('<title>Falha ao realizar login</title>');
        resposta.write('</head>');
        resposta.write('<body>');
        resposta.write('<p>Usuário ou senha inválidos!</p>');
        resposta.write('<a href="/login.html">Voltar</a>');

        if (requisicao.cookies.dataUltimoAcesso)
        {
            resposta.write('<p>');
            resposta.write('Seu último acesso foi em ' + requisicao.cookies.dataUltimoAcesso);
            resposta.write('</p>');
        }
        resposta.write('</body>');
        resposta.write('</html>');
        resposta.end();
    }
}


app.post ('/login', autenticarUsuario);

app.get('/login', (req,resp)=>{
    resp.redirect('/login.html');
});

app.get('/logout', (req,resp)=>{

    req.session.destroy();
    resp.redirect('/login.html');
});

// cadastro e lista de pessoas interessadas
function cadastrarInteressados (req, resp)
{
    const nome = req.body.nome;
    const email = req.body.email;
    const tel = req.body.tel;

    if(nome && email && tel)
    {
        listaInteressados.push ({
            nome: nome,
            email: email,
            tel: tel
        });
        resp.redirect('/listarInteressados');
    }
    else
    {
        resp.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
            <title>Cadastro de interessados</title>
        </head>
        <body>
        
            <nav class="navbar navbar-expand-lg bg-body-tertiary">
                <div class="container-fluid">
                  <a class="navbar-brand" href="menu.html">Pet shop</a>
                  <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                  </button>
                  <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
                    <div class="navbar-nav">
                      <a class="nav-link " href="cadastroInteressados.html">Cadastro de interessados</a>
                      <a class="nav-link" href="cadastroPet.html">Cadastro de pets</a>
                      <a class="nav-link" href="/adotar">Adotar um Pet</a>
                      <a class="nav-link " href="/logout">Sair</a>
                    </div>
                  </div>
                </div>
              </nav>
        
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-md-6 col-lg-5">
                        <form action="/cadastroInteressados" method="POST">
                            <legend class="text-center mt-3">Cadastro de interessados</legend>
                            <div class="row g-3">
                                <div class="col-md-12">
                                    <label for="nome">Nome</label>
                                    <input type="text" class="form-control" id="nome" name="nome" value="${nome}">
                                    `);
                                if(nome == "")
                                {
                                    resp.write(`<p style="color: white; background: lightcoral; padding: 5px; margin-top: 3px; border-radius: 6px;">Preencha o nome corretamente</p>`);
                                }

                                resp.write(`
                                </div>
                                <div class="col-md-12">
                                    <label for="email">Email</label>
                                    <input type="text" class="form-control" id="email" name="email" value="${email}">
                                    `);
                                    if(email == "")
                                    {
                                        resp.write(`<p style="color: white; background: lightcoral; padding: 5px; margin-top: 3px; border-radius: 6px;">Preencha o email corretamente</p>`);
                                    }
                                    resp.write(`
                                </div>
                                <div class="col-md-12">
                                    <label for="tel">Telefone</label>
                                    <input type="text" class="form-control" id="tel" name="tel" value="${tel}">
                                    `);
                                    if(tel == "")
                                    {
                                        resp.write(`<p style="color: white; background: lightcoral; padding: 5px; margin-top: 3px; border-radius: 6px;">Preencha o telefone corretamente</p>`);
                                    }
                                    resp.write(`
                                </div>
                                <div class="col-12">
                                    <button type="submit" class="btn btn-primary">Cadastrar</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        
            
        </body>
        </html>
        `);
    }
}

app.get('/listarInteressados', (req, resp) => {
    resp.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
        <title>Lista interessados</title>
    </head>
    <body>

    <h2 class="text-center" style="margin-top: 50px;">Lista de pessoas interessada</h2> 
        
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <table class="table">
                    <thead>
                    <tr>
                        <th scope="col">Nome</th>
                        <th scope="col">Email</th>
                        <th scope="col">Telefone</th>
                    </tr>
                    </thead>
                    <tbody>`);
                    for(let i=0; i<listaInteressados.length; i++)
                    {
                        resp.write(`
                            <tr>
                                <td>${listaInteressados[i].nome}</td>
                                <td>${listaInteressados[i].email}</td>
                                <td>${listaInteressados[i].tel}</td>
                            </tr>
                        `);
                    }
                    resp.write(`
                    </div>
                    </div>
                </div>
                    </tbody>
                </table>
                
                    <a href="/cadastroInteressados.html" class="text-center" style="text-decoration: none;">Voltar para tela de cadastro</a><br>
                    <a href="/menu.html" class="text-center" style="text-decoration: none;">Voltar para o menu</a>
                
    </body>
    </html>

    `);
    resp.end();
});

//cadastro e lista de pets

function cadastrarPets (req, resp)
{
    const nomepet = req.body.nomepet;
    const raca = req.body.raca;
    const idade = req.body.idade;

    if(nomepet && raca && idade)
    {
        listaPets.push ({
            nomepet: nomepet,
            raca: raca,
            idade: idade
        });
        resp.redirect('/listarPets');
    }
    else
    {
        resp.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
            <title>Cadastro de pets</title>
        </head>
        <body>
        
            <nav class="navbar navbar-expand-lg bg-body-tertiary">
                <div class="container-fluid">
                  <a class="navbar-brand" href="menu.html">Pet shop</a>
                  <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                  </button>
                  <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
                    <div class="navbar-nav">
                      <a class="nav-link "  href="cadastroInteressados.html">Cadastro de interessados</a>
                      <a class="nav-link" href="cadastroPet.html">Cadastro de pets</a>
                      <a class="nav-link" href="/adotar">Adotar um Pet</a>
                      <a class="nav-link " href="/logout">Sair</a>
                    </div>
                  </div>
                </div>
              </nav>
        
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-md-6 col-lg-5">
                        <form action="/cadastroPets" method="POST">
                            <legend class="text-center mt-3">Cadastro de Pets</legend>
                            <div class="row g-3">
                                <div class="col-md-12">
                                    <label for="nomepet">Nome</label>
                                    <input type="text" class="form-control" id="nomepet" name="nomepet" value="${nomepet}">
                                    `);

                                if(nomepet == "")
                                {
                                    resp.write(`<p style="color: white; background: lightcoral; padding: 5px; margin-top: 3px; border-radius: 6px;">Preencha o nome corretamente</p>`);
                                }
                                resp.write(`
                                </div>
                                <div class="col-md-12">
                                    <label for="raca">Raça</label>
                                    <input type="text" class="form-control" id="raca" name="raca" value="${raca}">
                                    `);
                                    if(raca == "")
                                    {
                                        resp.write(`<p style="color: white; background: lightcoral; padding: 5px; margin-top: 3px; border-radius: 6px;">Preencha a raça corretamente</p>`);
                                    }
                                    resp.write(`
                                </div>
                                <div class="col-md-12">
                                    <label for="idade">Idade em anos</label>
                                    <input type="text" class="form-control" id="idade" name="idade" value="${idade}">
                                    `);
                                    if(idade == "")
                                    {
                                        resp.write(`<p style="color: white; background: lightcoral; padding: 5px; margin-top: 3px; border-radius: 6px;">Preencha a idade corretamente</p>`);
                                    }
                                    resp.write(`
                                </div>
                                <div class="col-12">
                                    <button type="submit" class="btn btn-primary">Cadastrar</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        
            
        </body>
        </html>
        `);

    }
    resp.end();
}

app.get('/listarPets', (req,resp) => {

    resp.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
        <title>Lista interessados</title>
    </head>
    <body>

    <h2 class="text-center" style="margin-top: 50px;">Lista de pets</h2> 
        
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <table class="table">
                    <thead>
                    <tr>
                        <th scope="col">Nome</th>
                        <th scope="col">Raça</th>
                        <th scope="col">Idade</th>
                    </tr>
                    </thead>
                    <tbody>`);
                    for(let i=0; i<listaPets.length; i++)
                    {
                        resp.write(`
                            <tr>
                                <td>${listaPets[i].nomepet}</td>
                                <td>${listaPets[i].raca}</td>
                                <td>${listaPets[i].idade}</td>
                            </tr>
                        `);
                    }
                    resp.write(`
                    </div>
                    </div>
                </div>
                    </tbody>
                </table>
                
                    <a href="/cadastroPet.html" class="text-center" style="text-decoration: none;">Voltar para tela de cadastro</a><br>
                    <a href="/menu.html" class="text-center" style="text-decoration: none;">Voltar para o menu</a>
                
    </body>
    </html>

    `);
    resp.end();
});

app.get('/adotar', (req, resp) => {

    resp.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
        <title>Adoção</title>
    </head>
    <body>

    <nav class="navbar navbar-expand-lg bg-body-tertiary">
        <div class="container-fluid">
          <a class="navbar-brand" href="menu.html">Pet shop</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav">
              <a class="nav-link "  href="cadastroInteressados.html">Cadastro de interessados</a>
              <a class="nav-link" href="cadastroPet.html">Cadastro de pets</a>
              <a class="nav-link" href="adotarPet.html">Adotar um Pet</a>
              <a class="nav-link " href="/logout">Sair</a>
            </div>
          </div>
        </div>
      </nav>

    <h2 class="text-center" style="margin-top: 50px;">Adoção</h2> 
    <div class="container">
                <div class="row justify-content-center">
                    <div class="col-md-6 col-lg-5">
                        <h5>Pets</h5>
                        <form action="/listarAdocao" method="POST">
                        <select class="form-select" aria-label="Default select example" id="pet" name="pet">
                            <option selected disabled>Selecione uma opção</option>
    `); 
    
        for(let i=0; i<listaPets.length; i++)
        {
            resp.write(`
                <option>${listaPets[i].nomepet}, ${listaPets[i].raca}</option>           
            `);
        }

    resp.write(`             
    </select>
                    </div>
                </div>
            </div>

            <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-5">
                    <h5 style="margin-top: 25px;">Interessados</h5>
                    <select class="form-select" aria-label="Default select example" id="inter" name="inter">
                        <option selected disabled>Selecione uma opção</option>
`); 

        for(let i=0; i<listaInteressados.length; i++)
        {
            resp.write(`
                <option>${listaInteressados[i].nome}</option>           
            `);
            
        }

        resp.write(`             
        </select>
            <div class="col-12">
                <button type="submit" class="btn btn-primary" style="margin-top: 35px;">Adotar</button><br>
                <a href="/listarAdocao" class="text-center" style="text-decoration: none;">Listar lista de adoções</a><br>
            </div>
                </div>
            </div>
        </div>
        `);

        resp.write(`
        </form>
    </body>
    </html>

    `);
    resp.end();
});

function formAdocao (req, resp)
{
    const dataAdocao = new Date ();
    const dataFormatada = `${dataAdocao.getDate()}/${dataAdocao.getMonth() + 1}/${dataAdocao.getFullYear()}`;
    const pet = req.body.pet;
    const inter = req.body.inter;

    if (pet && inter)
    {
        listaAdocao.push ({
            pet: pet,
            inter: inter,
            data: dataFormatada
        });
        resp.redirect('/listarAdocao');
    }
}

app.get('/listarAdocao', (req,resp) => {

    
    resp.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
        <title>Lista interessados</title>
    </head>
    <body>

    <h2 class="text-center" style="margin-top: 50px;">Lista de adoção</h2> 
        
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <table class="table">
                    <thead>
                    <tr>
                        <th scope="col">Pets / Raça</th>
                        <th scope="col">Interessados</th>
                        <th scope="col">Data</th>
                    </tr>
                    </thead>
                    <tbody>`);
                    for(let i=0; i<listaAdocao.length; i++)
                    {
                        resp.write(`
                            <tr>
                                <td>${listaAdocao[i].pet}</td>
                                <td>${listaAdocao[i].inter}</td>
                                <td>${listaAdocao[i].data}</td>
                            </tr>
                        `);
                    }

                    resp.write(`
                    </div>
                    </div>
                </div>
                    </tbody>
                </table>
                
                    <a href="/adotar" class="text-center" style="text-decoration: none;">Voltar para tela de adoção</a><br>
                    <a href="/menu.html" class="text-center" style="text-decoration: none;">Voltar para o menu</a>
                
    </body>
    </html>

    `);
    resp.end();

});

// adoção de pet

app.use(usuarioEstaAutenticado,express.static(path.join(process.cwd(), 'protegido')));
app.post('/cadastroInteressados', cadastrarInteressados);
app.post('/cadastroPets', cadastrarPets);
app.post('/listarAdocao', formAdocao);

app.listen(porta,host,() => {
    console.log(`Servidor rodando em http://${host}:${porta}`);
})
