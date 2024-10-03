# src/graph1.py
# At the top of each graph script
import matplotlib
matplotlib.use('Agg')  # Use a non-interactive backend
import matplotlib.pyplot as plt


def create_graph():
    x = [1, 2, 3, 4]
    y = [10, 20, 25, 30]
    plt.plot(x, y)
    plt.title("Graph 1")
    plt.xlabel("X-axis")
    plt.ylabel("Y-axis")
    plt.savefig('static/images/graph3.png')  # Save graph to static/images/
    plt.close()  # Close the figure to free memory
