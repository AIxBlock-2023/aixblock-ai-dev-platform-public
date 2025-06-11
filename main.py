import dash
import dash_core_components as dcc
import dash_html_components as html
import pandas as pd

df = pd.read_csv("export/vuln_scores.csv")

app = dash.Dash(__name__)
app.layout = html.Div([
    html.H1("Scoring podatności CVSS + AI"),
    dcc.Graph(
        figure={
            'data': [
                {
                    'x': df["id"],
                    'y': df["combined_score"],
                    'type': 'bar',
                    'name': 'Combined Score'
                }
            ],
            'layout': {
                'title': 'Wyniki scoringu dla podatności'
            }
        }
    )
])

if __name__ == '__main__':
    app.run_server(debug=True)
