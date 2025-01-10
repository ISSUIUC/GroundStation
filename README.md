# GSS 2.1

the musings of an unhinged man:

base level architecture:

telem "frontend" (feathers) <- serial -> combiner (now run as part of gss) <- ws -> GSS Display (react)
                                        (also published to mqtt)


magic:
`docker-compose -f compose.yml up --build`

or `./run.sh`

### mqtt weirdness
using non-standard port 1884 because 1883 conflicts with existing installs of like emqx and mosquitto

ws packet structure:

```json

{
    "metadata": {
        "raw_stream": "FlightData-Sustainer",
        "interpret_as": "sustainer", // valid values: "sustainer", "booster", "common"
        "time_published": ...,
        "time_recieved": ...,
    },
    "data": {
        // packet payload here
    }
}

```

tx packet:

```json
{
    "metadata": {
        "sent_to": "sustainer",
        "sent_time": ...
    },
    "data": {
        // payload here
    }
}
```


### config.ini:
config.ini has shared configs between multiple containers and is mounted as a volume in relevant locations (root for backend, /public for frontend)

Config fields prefixed with `Telemetry:` (like `Telemetry:sustainer` define a single "telemetry channel" (a pair of data/control channels for a single data source, think: one stage of a rocket))

