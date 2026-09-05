## Organization Chart

```mermaid
flowchart TD
    A["Owner/Visonary — Gavin"]
    B["Integrator — Gavin"]

    subgraph AA["Admin"]
        direction TB
        C1["People Manager"]
        C2["Hiring Owner"]
        C3["Onboarding Owner"]

    end

    subgraph BB["Operations"]
        direction TB
        D["Crew Leader"]
        l["L"]
        e["E"]

        D --> l
        D --> e

    end

   subgraph CC["Leads"]
        direction TB
        E["Sale Manager"]
        leadIntakeOwner["Lead Intake Owner"]
        estimator["Estimator"]

    end


    A --> B
    B --> C1
    B --> C2
    B --> C3
    B --> D
    B --> E
```
