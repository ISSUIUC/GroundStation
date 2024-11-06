from queue import Queue, Empty

q = Queue()

# Add an item to the queue
q.put("item1")

# Blocking call (block=True), will wait if queue is empty (though here it isn't empty)
print(q.get(True))  # This will output 'item1'

# Non-blocking example (block=False)
try:
    print(q.get(False))  # Queue is empty, will raise queue.Empty
except Empty:
    print("Queue is empty!")
