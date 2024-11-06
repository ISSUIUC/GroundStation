from util.queue_data import q

q.put("Hello, World!")
print(q.get(False))

for i in range (0, 9):
    q.put(i)

for i in range (4, 6):
    print(q.queue[i])
